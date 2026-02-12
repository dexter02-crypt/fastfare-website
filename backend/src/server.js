import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Cron utilities (available for manual trigger via admin API)
// import { startSettlementCron } from './utils/settlementCron.js';
// import { startTierEvaluationCron } from './utils/tierEvaluation.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
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
  origin: '*',
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
app.use('/api/tracking', driverLocationsRoutes);

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

    // Use httpServer instead of app.listen for Socket.IO — bind to 0.0.0.0 for LAN access
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FastFare Backend running on http://0.0.0.0:${PORT}`);
      console.log(`📦 WMS routes mounted at /api/wms/*`);
      console.log(`💰 Settlement engine mounted at /api/settlement/*`);
      console.log(`🔌 Socket.io enabled for real-time tracking`);
      console.log(`⚙️  Settlement cron: POST /api/settlement/process`);
      console.log(`⚙️  Tier evaluation: POST /api/tiers/evaluate`);
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
  console.log('MongoDB disconnected');
});
