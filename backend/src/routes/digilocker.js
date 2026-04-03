import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { PendingRegistration } from '../models/PendingRegistration.js';
import KycAttempt from '../models/KycAttempt.js';
import OnboardingEvent from '../models/OnboardingEvent.js';
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
router.get('/init', protect, async (req, res) => {
    try {
        const state = crypto.randomBytes(32).toString('hex');
        const attemptId = crypto.randomUUID();
        const { codeVerifier, codeChallenge } = generatePKCE();
        
        req.session.digilocker_oauth_state = state;
        req.session.digilocker_user_id = req.user._id.toString();
        req.session.digilocker_code_verifier = codeVerifier;
        req.session.digilocker_attempt_id = attemptId;

        // Create tracking record
        await KycAttempt.create({
            attempt_id: attemptId,
            user_id: req.user._id,
            final_status: 'initiated',
            verification_source: 'DigiLocker'
        });

        // Set status to in_progress per Issue 1
        await User.findByIdAndUpdate(req.user._id, {
            digilocker_status: 'in_progress',
            digilocker_initiated_at: new Date()
        });

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

// Route: GET /api/auth/digilocker/callback
router.get('/callback', async (req, res) => {
    const baseUrl = process.env.APP_BASE_URL || process.env.BACKEND_URL || 'https://fastfare.in';
    const reqId = crypto.randomUUID();
    const attemptId = req.session.digilocker_attempt_id;

    console.log(`[DigiLocker][${reqId}] --- Callback Hit ---`);
    const safeQuery = { ...req.query };
    if (safeQuery.code) safeQuery.code = '[MASKED]';
    console.log(`[DigiLocker][${reqId}] Query:`, JSON.stringify(safeQuery));

    let kycAttempt = null;
    if (attemptId) {
        kycAttempt = await KycAttempt.findOne({ attempt_id: attemptId });
        if (kycAttempt) {
            kycAttempt.callback_received_at = new Date();
        }
    }

    const errorBase = req.session.digilocker_pending_reg_id 
        ? `${baseUrl}/register/user` 
        : `${baseUrl}/settings`;

    // Closure helper for redirects handling DB state wrapping
    const trackAndRedirect = async (url, status, errorReason = null) => {
        if (kycAttempt) {
            kycAttempt.final_status = status;
            if (errorReason) kycAttempt.internal_error_reason = errorReason;
            await kycAttempt.save().catch(e => console.error(`[DigiLocker][${reqId}] Attempt Save Err:`, e));
        }
        return res.redirect(url);
    };

    try {
        const { state, code, error: dlError, error_description } = req.query;

        if (dlError) {
            console.warn(`[DigiLocker][${reqId}] DigiLocker returned error:`, dlError, error_description);
            return trackAndRedirect(`${errorBase}?kyc_error=${encodeURIComponent(dlError)}`, 'failed', `provider_error: ${dlError}`);
        }
        
        // Step A — Validate State
        const savedState = req.session.digilocker_oauth_state;
        if (!savedState || state !== savedState) {
            console.warn(`[DigiLocker][${reqId}] OAuth state mismatch.`);
            return trackAndRedirect(`${errorBase}?kyc_error=invalid_state`, 'failed', 'invalid_state');
        }
        
        if (kycAttempt) kycAttempt.state_validated_at = new Date();
        const codeVerifier = req.session.digilocker_code_verifier;

        // Strip Session
        delete req.session.digilocker_oauth_state;
        delete req.session.digilocker_code_verifier;
        delete req.session.digilocker_attempt_id;
        req.session.save();

        if (!code) {
            console.warn(`[DigiLocker][${reqId}] OAuth code missing.`);
            return trackAndRedirect(`${errorBase}?kyc_error=no_code_received`, 'failed', 'no_code_received');
        }

        // Step C — Exchange Code for Token
        const clientId = process.env.DIGILOCKER_CLIENT_ID;
        const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
        const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
             return trackAndRedirect(`${errorBase}?kyc_error=configuration_error`, 'failed', 'missing_env_variables');
        }

        const tokenBody = new URLSearchParams();
        tokenBody.append('code', code);
        tokenBody.append('grant_type', 'authorization_code');
        tokenBody.append('client_id', clientId);
        tokenBody.append('client_secret', clientSecret);
        tokenBody.append('redirect_uri', redirectUri);
        if (codeVerifier) tokenBody.append('code_verifier', codeVerifier);

        let tokenResponse;
        try {
            const tokenReq = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenBody
            });
            tokenResponse = await tokenReq.json();
            
            if (!tokenReq.ok) {
                if (kycAttempt) kycAttempt.token_exchange_status = 'failed';
                return trackAndRedirect(`${errorBase}?kyc_error=token_exchange_failed`, 'failed', 'token_rejection');
            }
            if (kycAttempt) kycAttempt.token_exchange_status = 'success';
        } catch (err) {
            if (kycAttempt) kycAttempt.token_exchange_status = 'failed';
            return trackAndRedirect(`${errorBase}?kyc_error=token_exchange_failed`, 'failed', 'token_network_err');
        }

        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
             return trackAndRedirect(`${errorBase}?kyc_error=token_exchange_failed`, 'failed', 'missing_access_token');
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
                if (kycAttempt) kycAttempt.digilocker_fetch_status = 'failed';
                return trackAndRedirect(`${errorBase}?kyc_error=profile_fetch_failed`, 'failed', 'profile_fetch_network_err');
            }
            if (kycAttempt) kycAttempt.digilocker_fetch_status = 'success';
        } catch (err) {
            if (kycAttempt) kycAttempt.digilocker_fetch_status = 'failed';
            return trackAndRedirect(`${errorBase}?kyc_error=profile_fetch_failed`, 'failed', 'profile_fetch_network_err');
        }
        
        // Extract fields
        const digilockerId = profileData.digilocker_id || profileData.sub || profileData.id || '';
        const kycName = profileData.name || '';
        const kycDob = profileData.dob || '';
        const kycGender = profileData.gender || '';
        const eaadhaar = profileData.eaadhaar || profileData.uid || '';

        if (kycAttempt) kycAttempt.digilocker_reference_id = digilockerId;

        // Step E — Match Flow & Update Database
        const pendingRegId = req.session.digilocker_pending_reg_id;
        const userId = req.session.digilocker_user_id;

        if (pendingRegId) {
            // Flow: Pre-Registration Identity Verification
            const pendingReg = await PendingRegistration.findById(pendingRegId);
            if (!pendingReg) {
                return trackAndRedirect(`${baseUrl}/register/user?kyc_error=session_expired`, 'failed', 'pending_reg_not_found');
            }
            
            pendingReg.digilocker_verified = true;
            pendingReg.digilocker_verified_at = new Date();
            pendingReg.digilocker_id = digilockerId;
            pendingReg.kyc_name = kycName;
            pendingReg.kyc_dob = kycDob;
            pendingReg.kyc_gender = kycGender;
            pendingReg.status = "digilocker_verified";
            await pendingReg.save();

            if (kycAttempt) kycAttempt.persistence_status = 'success';

            req.session.digilocker_verified_name = kycName;
            req.session.digilocker_signup_verified = true;
            delete req.session.digilocker_pending_reg_id;

            return req.session.save((err) => {
                const safeName = encodeURIComponent(kycName);
                return trackAndRedirect(`${baseUrl}/register/user?kyc_success=true&verified_name=${safeName}`, 'success');
            });
        } else if (userId) {
            // Flow: Existing User Settings KYC
            const user = await User.findById(userId);
            if (!user) {
                return trackAndRedirect(`${baseUrl}/login?error=session_expired`, 'failed', 'user_not_found');
            }

            // ══════ Duplicate Identity Check ══════
            const duplicateUser = await User.findOne({ 
                'verifiedIdentity.digilockerId': digilockerId,
                _id: { $ne: user._id }
            });
            const duplicateIdentityFlag = !!duplicateUser;
            
            // ══════ Name Mismatch Check ══════
            let nameMismatchFlag = false;
            let nameMismatchDetails = '';
            
            const expectedName = user.contactPerson || user.businessName || '';
            if (expectedName && kycName) {
                // simple comparison (can be enhanced with fuzzy matching)
                if (expectedName.toLowerCase().trim() !== kycName.toLowerCase().trim()) {
                    nameMismatchFlag = true;
                    nameMismatchDetails = `Profile: '${expectedName}' vs DigiLocker: '${kycName}'`;
                }
            }

            const attemptCount = (user.verifiedIdentity?.attemptCount || 0) + 1;

            // Sync Database verifiedIdentity
            user.verifiedIdentity = {
                source: 'digilocker',
                status: 'verified',
                fullName: kycName,
                dob: kycDob,
                gender: kycGender,
                digilockerId: digilockerId,
                aadhaarLastFour: eaadhaar ? eaadhaar.slice(-4) : '',
                verifiedAt: new Date(),
                lastAttemptAt: new Date(),
                attemptCount: attemptCount,
                referenceId: kycAttempt ? kycAttempt._id.toString() : ''
            };

            user.nameMismatchFlag = nameMismatchFlag;
            user.nameMismatchDetails = nameMismatchDetails;
            user.duplicateIdentityFlag = duplicateIdentityFlag;
            if (duplicateIdentityFlag && !user.reviewFlags.includes('duplicate_identity')) {
                user.reviewFlags.push('duplicate_identity');
            }
            if (nameMismatchFlag && !user.reviewFlags.includes('name_mismatch')) {
                user.reviewFlags.push('name_mismatch');
            }

            // Legacy sync for backward compatibility
            user.digilocker_verified = true;
            user.digilocker_verified_at = new Date();
            user.digilocker_id = digilockerId;
            user.kyc_name = kycName;
            user.kyc_dob = kycDob;
            user.kyc_gender = kycGender;
            user.kyc_status = "verified";
            user.digilocker_status = "verified";

            user.kyc = {
                ...user.kyc,
                status: "verified",
                digilocker: {
                    status: "verified",
                    verifiedAt: new Date(),
                    aadhaarLastFour: eaadhaar ? eaadhaar.slice(-4) : '',
                    dob: kycDob,
                    gender: kycGender
                }
            };

            const previousStatus = user.onboardingStatus || 'draft';
            let newStatus = 'digilocker_verified';
            let eventType = 'digilocker_verified';
            let eventReason = 'DigiLocker verification completed';

            // ══════ Auto Approval Logic ══════
            if (user.role === 'user' && !nameMismatchFlag && !duplicateIdentityFlag && attemptCount <= 3) {
                newStatus = 'approved';
                eventType = 'auto_approved';
                eventReason = 'Auto-approved: DigiLocker verified, no flags, user role';
                
                user.onboardingStatus = newStatus;
                user.onboardingApprovedAt = new Date();
                user.payoutEligible = true;
                user.operationallyActive = true;
            } else {
                // If it was already pending review, keep it pending review, else state machine advances
                newStatus = ['submitted', 'pending_review', 'needs_more_info'].includes(previousStatus) 
                            ? 'pending_review' : 'digilocker_verified';
                user.onboardingStatus = newStatus;
            }

            await user.save();
            
            if (kycAttempt) kycAttempt.persistence_status = 'success';

            // Log Onboarding Audit Event
            await OnboardingEvent.create({
                targetUserId: user._id,
                targetRole: user.role,
                eventType: eventType,
                actorId: user._id,
                actorRole: user.role === 'shipment_partner' ? 'partner' : 'user',
                previousStatus,
                newStatus,
                reason: eventReason,
                metadata: {
                    duplicateIdentityFlag,
                    nameMismatchFlag,
                    nameMismatchDetails
                }
            });

            delete req.session.digilocker_user_id;
            return req.session.save((err) => {
                return trackAndRedirect(`${baseUrl}/settings?kyc_success=true`, 'success');
            });
        } else {
            return trackAndRedirect(`${baseUrl}/login?error=session_expired`, 'failed', 'missing_context');
        }

    } catch (error) {
        console.error(`[DigiLocker][${reqId}] Final Callback error block:`, error);
        return trackAndRedirect(`${errorBase}?kyc_error=unknown_error`, 'failed', 'unhandled_exception');
    }
});
// Route: GET /api/auth/digilocker/status
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('digilocker_verified digilocker_verified_at kyc_name kyc_status digilocker_status digilocker_initiated_at');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Timeout fallback: 30 minutes
        let currentStatus = user.digilocker_status || 'not_started';
        if (currentStatus === 'in_progress' && user.digilocker_initiated_at) {
            const timeDiff = Date.now() - new Date(user.digilocker_initiated_at).getTime();
            if (timeDiff > 30 * 60 * 1000) {
                currentStatus = 'not_started';
                await User.findByIdAndUpdate(req.user.id, {
                    digilocker_status: 'not_started'
                });
            }
        }

        res.json({
            digilocker_verified: !!user.digilocker_verified,
            digilocker_verified_at: user.digilocker_verified_at ? user.digilocker_verified_at.toISOString() : null,
            kyc_name: user.kyc_name || null,
            kyc_status: user.digilocker_verified ? 'verified' : currentStatus
        });
    } catch (error) {
        console.error('DigiLocker Status fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
