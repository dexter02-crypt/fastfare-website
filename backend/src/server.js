import 'dotenv/config';  // MUST be first — loads .env before any route imports use process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

// Existing website routes
import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipments.js';
import trackingRoutes from './routes/tracking.js';
import userRoutes from './routes/users.js';
import gstinRoutes from './routes/gstin.js';
import paymentRoutes from './routes/payment.js';
import kycRoutes from './routes/kyc.js';
import fleetRoutes from './routes/fleet.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';

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
import partnerAuthRoutes from './routes/partner-auth.js';
import parcelRoutes from './routes/parcels.js';
import mobileTripsRoutes from './routes/mobile-trips.js';
import driverLocationsRoutes from './routes/driver-locations.js';
import partnerTeamRoutes from './routes/partner-team.js';
import scanPartnerAuthRoutes from './routes/scan-partner-auth.js';

// Socket handler
import { locationSocket } from './socket/location.socket.js';

import { seedAdmin } from './scripts/seedAdmin.js';

// Settlement engine routes
import settlementRoutes from './routes/settlement.js';
import sellerStatsRoutes from './routes/seller-stats.js';
import tierRoutes from './routes/tiers.js';
import codRoutes from './routes/cod.js';
import partnerLedgerRoutes from './routes/partner-ledger.js';
import adminOverrideRoutes from './routes/admin-overrides.js';




const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io setup with CORS
const WEB_ORIGINS = ['https://fastfare.org', 'https://www.fastfare.org'];

// CORS handler: allows web origins + native mobile apps (no Origin header)
const corsHandler = process.env.NODE_ENV === 'production'
  ? (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || WEB_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
  : true; // Allow all origins in development

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

// Middleware
app.use(cors({
  origin: corsHandler,
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ─── Existing Website Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gstin', gstinRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);

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
app.use('/api/parcels', parcelRoutes);
app.use('/api/trips', mobileTripsRoutes);
app.use('/api/driver-locations', driverLocationsRoutes);
app.use('/api/partner-team', partnerTeamRoutes);
app.use('/api/scan-partner-auth', scanPartnerAuthRoutes);

// ─── Settlement Engine Routes ───
app.use('/api/settlement', settlementRoutes);
app.use('/api/seller', sellerStatsRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/cod', codRoutes);
app.use('/api/partner', partnerLedgerRoutes);
app.use('/api/admin', adminOverrideRoutes);

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
