import 'dotenv/config';  // MUST be first — loads .env before any route imports use process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';

// Existing website routes
import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipments.js';
import trackingRoutes from './routes/tracking.js';
import userRoutes from './routes/users.js';
import returnsRoutes from './routes/returns.js';
import weightDisputesRoutes from './routes/weight-disputes.js';
import gstinRoutes from './routes/gstin.js';
import paymentRoutes from './routes/payment.js';
import kycRoutes from './routes/kyc.js';
import fleetRoutes from './routes/fleet.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import promoRoutes from './routes/promo.js';
import walletRoutes from './routes/wallet.js';
import digilockerRoutes from './routes/digilocker.js';

// WMS routes (from PC software)
import wmsVehicleRoutes from './routes/wms-vehicles.js';
import wmsDriverRoutes from './routes/wms-drivers.js';
import wmsTripRoutes from './routes/wms-trips.js';
import wmsInventoryRoutes from './routes/wms-inventory.js';
import wmsRtdRoutes from './routes/wms-rtd.js';
import wmsStatsRoutes from './routes/wms-stats.js';
import wmsReportsRoutes from './routes/wms-reports.js';
import wmsInboundRoutes from './routes/wms-inbound.js';
import wmsTrackingRoutes, { setWmsTrackingIo } from './routes/wms-tracking.js';
import wmsDriverAuthRoutes from './routes/wms-driver-auth.js';

// Mobile app routes
import driverAppRoutes from './routes/driver-app.js';
import partnerAuthRoutes from './routes/partner-auth.js';
import parcelRoutes from './routes/parcels.js';
import mobileTripsRoutes from './routes/mobile-trips.js';
import driverLocationsRoutes from './routes/driver-locations.js';
import partnerTeamRoutes from './routes/partner-team.js';
import scanPartnerAuthRoutes from './routes/scan-partner-auth.js';
import fleetViewRoutes from './routes/fleet-view.js';

// Carrier routes

import carrierRoutes from './routes/carriers.js';
import carrierWebhookRoutes from './routes/carrier-webhook.js';

// Socket handler
import { locationSocket } from './socket/location.socket.js';
import { initSocket } from './services/socket.js';

import { seedAdmin } from './scripts/seedAdmin.js';

// Settlement engine routes
import settlementRoutes from './routes/settlement.js';
import sellerStatsRoutes from './routes/seller-stats.js';
import tierRoutes from './routes/tiers.js';
import codRoutes from './routes/cod.js';
import partnerLedgerRoutes from './routes/partner-ledger.js';
import adminOverrideRoutes from './routes/admin-overrides.js';
import onboardingRoutes from './routes/onboarding.js';

// QR Scan-to-Pickup routes
import scanRoutes from './routes/scan.js';

// Billing & Settings routes (Bugs 26-29)
import billingRoutes from './routes/billing.js';
import settingsRoutes from './routes/settings.js';

// Account & Admin Deletion Routes
import accountRoutes from './routes/account.js';
import adminRoutes from './routes/admin.js';

// User-facing My Reports routes
import userReportsRoutes from './routes/user-reports.js';

// Partner Pricing & Rate Calculator
import partnerPricingRoutes from './routes/partner-pricing.js';
import ratesRoutes from './routes/rates.js';

// User Orders Route (3-dot action menu)
import ordersRoutes from './routes/orders.js';

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// DigiLocker Startup Check
console.log('--- DigiLocker Configuration Check ---');
console.log(`DIGILOCKER_CLIENT_ID: ${process.env.DIGILOCKER_CLIENT_ID ? 'Configured' : 'Missing'}`);
console.log(`DIGILOCKER_CLIENT_SECRET: ${process.env.DIGILOCKER_CLIENT_SECRET ? 'Configured' : 'Missing'}`);
console.log(`DIGILOCKER_REDIRECT_URI: ${process.env.DIGILOCKER_REDIRECT_URI ? 'Configured (' + process.env.DIGILOCKER_REDIRECT_URI + ')' : 'Missing'}`);
console.log('------------------------------------');

// Socket.io setup with CORS
const WEB_ORIGINS = ['http://localhost:8080', 'http://localhost:5173', 'https://fastfare.in', 'https://www.fastfare.in', 'https://fastfare.org', 'https://www.fastfare.org'];

// CORS handler: allows web origins + native mobile apps (no Origin header)
const corsHandler = (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or matched origins
    if (!origin || WEB_ORIGINS.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };

const io = new Server(httpServer, {
  cors: {
    origin: corsHandler,
    methods: ["GET", "POST"]
  }
});

// Pass io to WMS tracking routes
setWmsTrackingIo(io);

// Store io on app so HTTP routes can broadcast socket events
app.set('io', io);

// Initialize socket handlers
locationSocket(io);
initSocket(io);

// Middleware
app.use(cors({
  origin: corsHandler,
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Trust Nginx proxy (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Global Session for OAuth persistence across subdomains/paths
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.JWT_SECRET || 'fastfare_oauth_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: isProduction,
        path: '/', 
        maxAge: 3600000, // 1 hour
        sameSite: 'lax',
        httpOnly: true
    }
}));


// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve downloadable files (APKs etc.)
app.use('/downloads', express.static('public/downloads'));

// ─── Digilocker Direct Public Auth Route ───
app.use('/api/auth/digilocker', digilockerRoutes);

// ─── Existing Website Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/weight-disputes', weightDisputesRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gstin', gstinRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/user/reports', userReportsRoutes);
app.use('/api/orders', ordersRoutes);

// ─── WMS Routes (Warehouse Management System) ───
app.use('/api/wms/vehicles', wmsVehicleRoutes);
app.use('/api/wms/drivers', wmsDriverRoutes);
app.use('/api/wms/trips', wmsTripRoutes);
app.use('/api/wms/inventory', wmsInventoryRoutes);
app.use('/api/wms/rtd', wmsRtdRoutes);
app.use('/api/wms/stats', wmsStatsRoutes);
app.use('/api/wms/reports', wmsReportsRoutes);
app.use('/api/wms/inbound', wmsInboundRoutes);
app.use('/api/wms/tracking', wmsTrackingRoutes);
app.use('/api/wms/driver-auth', wmsDriverAuthRoutes);

// ─── Mobile App Routes ───
app.use('/api/partner-auth', partnerAuthRoutes);
app.use('/api/driver-auth', wmsDriverAuthRoutes);
app.use('/api/driver', driverAppRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/trips', mobileTripsRoutes);
app.use('/api/driver-locations', driverLocationsRoutes);
app.use('/api/partner-team', partnerTeamRoutes);
app.use('/api/scan-partner-auth', scanPartnerAuthRoutes);
app.use('/api/partner/fleet-view', fleetViewRoutes);

// ─── Carrier Routes (Now Partner-driven) ───
app.use('/api/carriers', carrierRoutes);
app.use('/api/carrier-webhook', carrierWebhookRoutes);

// ─── Settlement Engine Routes ───
app.use('/api/settlement', settlementRoutes);
app.use('/api/seller', sellerStatsRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/cod', codRoutes);
app.use('/api/partner', partnerLedgerRoutes);
app.use('/api/partner/pricing', partnerPricingRoutes);
app.use('/api/admin', adminOverrideRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/rates', ratesRoutes);

// ─── QR Scan-to-Pickup Routes ───
app.use('/api/scan', scanRoutes);

// ─── Billing & Settings Routes (Bugs 26-29) ───
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Account & Admin Deletion Routes ───
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FastFare API is running (WMS + Website)', socketio: true });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    seedAdmin().catch(err => console.error('Seed error:', err));

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FastFare Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});
