import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { PendingRegistration } from '../models/PendingRegistration.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// PKCE Helper: Generate code_verifier and code_challenge
function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    return { codeVerifier, codeChallenge };
}

// Route: GET /auth/digilocker/init (Settings KYC flow — requires auth)
router.get('/init', protect, (req, res) => {
    try {
        const state = crypto.randomBytes(32).toString('hex');
        const { codeVerifier, codeChallenge } = generatePKCE();
        
        req.session.digilocker_oauth_state = state;
        req.session.digilocker_user_id = req.user._id.toString();
        req.session.digilocker_code_verifier = codeVerifier;

        const clientId = process.env.DIGILOCKER_CLIENT_ID;
        const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;
        
        if (!clientId || !redirectUri) {
            console.error('DigiLocker config missing', { clientId, redirectUri });
            return res.status(500).json({ error: 'DigiLocker configuration missing' });
        }

        req.session.save((err) => {
             if (err) {
                 console.error('Session save error:', err);
                 return res.status(500).json({ error: 'Failed to initialize secure session' });
             }
             
             const authUrl = new URL('https://api.digitallocker.gov.in/public/oauth2/1/authorize');
             authUrl.searchParams.append('response_type', 'code');
             authUrl.searchParams.append('client_id', clientId);
             authUrl.searchParams.append('redirect_uri', redirectUri);
             authUrl.searchParams.append('state', state);
             authUrl.searchParams.append('code_challenge', codeChallenge);
             authUrl.searchParams.append('code_challenge_method', 'S256');
             
             res.json({ auth_url: authUrl.toString() });
        });
    } catch (error) {
        console.error('Init error:', error);
        res.status(500).json({ error: 'Internal server error during init' });
    }
});

// Route: GET /auth/digilocker/callback
router.get('/callback', async (req, res) => {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';

    console.log('--- DigiLocker Callback Hit ---');
    console.log('Query:', JSON.stringify(req.query));
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', JSON.stringify({
        has_state: !!req.session.digilocker_oauth_state,
        has_user_id: !!req.session.digilocker_user_id,
        has_pending_reg: !!req.session.digilocker_pending_reg_id,
        has_code_verifier: !!req.session.digilocker_code_verifier
    }));

    const errorBase = req.session.digilocker_pending_reg_id 
        ? `${baseUrl}/register/user` 
        : `${baseUrl}/settings`;

    try {
        const { state, code, error: dlError, error_description } = req.query;

        // Handle DigiLocker error responses (user denied, invalid request, etc.)
        if (dlError) {
            console.warn('DigiLocker returned error:', dlError, error_description);
            return res.redirect(`${errorBase}?kyc_error=${encodeURIComponent(dlError)}`);
        }
        
        // Step A — Validate State
        const savedState = req.session.digilocker_oauth_state;
        if (!savedState || state !== savedState) {
            console.warn('OAuth state mismatch or missing session.');
            return res.redirect(`${errorBase}?kyc_error=invalid_state`);
        }
        
        // Retrieve code_verifier for PKCE token exchange
        const codeVerifier = req.session.digilocker_code_verifier;

        // Immediately clear state for security
        delete req.session.digilocker_oauth_state;
        delete req.session.digilocker_code_verifier;
        req.session.save();

        // Step B — Validate Code
        if (!code) {
            console.warn('OAuth code missing.');
            return res.redirect(`${errorBase}?kyc_error=no_code_received`);
        }

        // Step C — Exchange Code for Token (with PKCE code_verifier)
        const clientId = process.env.DIGILOCKER_CLIENT_ID;
        const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
        const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;

        const tokenBody = new URLSearchParams();
        tokenBody.append('code', code);
        tokenBody.append('grant_type', 'authorization_code');
        tokenBody.append('client_id', clientId);
        tokenBody.append('client_secret', clientSecret);
        tokenBody.append('redirect_uri', redirectUri);
        if (codeVerifier) {
            tokenBody.append('code_verifier', codeVerifier);
        }

        let tokenResponse;
        try {
            const tokenReq = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenBody
            });
            tokenResponse = await tokenReq.json();
            
            if (!tokenReq.ok) {
                console.error('Token fetch failed with:', tokenResponse);
                throw new Error('Token exchange failed');
            }
        } catch (err) {
            console.error('DigiLocker token exchange error:', err);
            return res.redirect(`${errorBase}?kyc_error=token_exchange_failed`);
        }

        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
             console.error('DigiLocker token exchange missing access_token in response');
             return res.redirect(`${errorBase}?kyc_error=token_exchange_failed`);
        }

        // Step D — Fetch User Profile
        let profileData;
        try {
            const profileReq = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/user', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            profileData = await profileReq.json();
            
            if (!profileReq.ok) {
                console.error('Profile fetch failed with:', profileData);
                throw new Error('Profile fetch failed');
            }
        } catch (err) {
            console.error('DigiLocker profile fetch error:', err);
            return res.redirect(`${errorBase}?kyc_error=profile_fetch_failed`);
        }
        
        // Extract fields
        const digilockerId = profileData.digilocker_id || profileData.sub || profileData.id || '';
        const kycName = profileData.name || '';
        const kycDob = profileData.dob || '';
        const kycGender = profileData.gender || '';

        // Step E — Match Flow & Update Database
        const pendingRegId = req.session.digilocker_pending_reg_id;
        const userId = req.session.digilocker_user_id;

        if (pendingRegId) {
            // Flow: Pre-Registration Identity Verification
            const pendingReg = await PendingRegistration.findById(pendingRegId);
            if (!pendingReg) {
                console.warn('Pending registration session expired.');
                return res.redirect(`${baseUrl}/register/user?kyc_error=session_expired`);
            }
            
            pendingReg.digilocker_verified = true;
            pendingReg.digilocker_verified_at = new Date();
            pendingReg.digilocker_id = digilockerId;
            pendingReg.kyc_name = kycName;
            pendingReg.kyc_dob = kycDob;
            pendingReg.kyc_gender = kycGender;
            pendingReg.status = "digilocker_verified";
            await pendingReg.save();

            req.session.digilocker_verified_name = kycName;
            req.session.digilocker_signup_verified = true;
            delete req.session.digilocker_pending_reg_id;

            req.session.save((err) => {
                const safeName = encodeURIComponent(kycName);
                return res.redirect(`${baseUrl}/register/user?kyc_success=true&verified_name=${safeName}`);
            });
        } else if (userId) {
            // Flow: Existing User Settings KYC
            await User.findByIdAndUpdate(userId, {
                $set: {
                    digilocker_verified: true,
                    digilocker_verified_at: new Date(),
                    digilocker_id: digilockerId,
                    kyc_name: kycName,
                    kyc_dob: kycDob,
                    kyc_gender: kycGender,
                    kyc_status: "verified"
                }
            });

            delete req.session.digilocker_user_id;
            req.session.save((err) => {
                return res.redirect(`${baseUrl}/settings?kyc_success=true`);
            });
        } else {
            console.warn('No suitable flow detected (missing user_id or pending_reg_id)');
            return res.redirect(`${baseUrl}/login?error=session_expired`);
        }

    } catch (error) {
        console.error('Callback processing error:', error);
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        res.redirect(`${baseUrl}?error=unknown_error`);
    }
});

export default router;
