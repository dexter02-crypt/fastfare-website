import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Truck from '../models/Truck.js';
import Driver from '../models/Driver.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Configure upload directories
const trucksUploadDir = 'uploads/trucks';
const driversUploadDir = 'uploads/drivers';

// Create directories if they don't exist
[trucksUploadDir, driversUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = req.baseUrl.includes('trucks') || req.path.includes('trucks')
            ? trucksUploadDir
            : driversUploadDir;
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==================== TRUCK ROUTES ====================

// Add truck (pending status)
router.post('/trucks', protect, upload.array('photos', 5), async (req, res) => {
    try {
        const { name, chassisNo, rcNo, dlNo } = req.body;

        // Check if chassis number already exists
        const existingTruck = await Truck.findOne({ chassisNo: chassisNo.toUpperCase() });
        if (existingTruck) {
            return res.status(400).json({ error: 'Truck with this chassis number already exists' });
        }

        const photos = req.files ? req.files.map(f => f.path) : [];

        const truck = new Truck({
            name,
            chassisNo,
            rcNo,
            dlNo,
            photos,
            status: 'pending',
            createdBy: req.user._id
        });

        await truck.save();

        res.status(201).json({
            success: true,
            message: 'Truck submitted for approval',
            truck
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trucks (user sees their own, admin sees all)
router.get('/trucks', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const { status } = req.query;

        if (status && status !== 'all') {
            query.status = status;
        }

        const trucks = await Truck.find(query)
            .populate('createdBy', 'businessName email')
            .populate('approvedBy', 'businessName')
            .sort({ createdAt: -1 });

        res.json({ trucks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single truck
router.get('/trucks/:id', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id)
            .populate('createdBy', 'businessName email')
            .populate('approvedBy', 'businessName');

        if (!truck) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        // Check access
        if (req.user.role !== 'admin' && truck.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ truck });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin approve truck
router.post('/trucks/:id/approve', protect, admin, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);

        if (!truck) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        truck.status = 'approved';
        truck.approvedBy = req.user._id;
        truck.approvedAt = new Date();
        truck.rejectionReason = null;
        await truck.save();

        res.json({
            success: true,
            message: 'Truck approved successfully',
            truck
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin reject truck
router.post('/trucks/:id/reject', protect, admin, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const truck = await Truck.findById(req.params.id);

        if (!truck) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        truck.status = 'rejected';
        truck.rejectionReason = reason;
        truck.approvedBy = null;
        truck.approvedAt = null;
        await truck.save();

        res.json({
            success: true,
            message: 'Truck rejected',
            truck
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin delete truck
router.delete('/trucks/:id', protect, admin, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);

        if (!truck) {
            return res.status(404).json({ error: 'Truck not found' });
        }

        // Delete photos from filesystem
        truck.photos.forEach(photo => {
            if (fs.existsSync(photo)) {
                fs.unlinkSync(photo);
            }
        });

        await Truck.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Truck deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DRIVER ROUTES ====================

// Add driver (auto-approved)
router.post('/drivers', protect, upload.single('photo'), async (req, res) => {
    try {
        const { fullName, mobile, dlNo, aadhaar } = req.body;

        const driver = new Driver({
            fullName,
            mobile,
            dlNo,
            aadhaar,
            photo: req.file ? req.file.path : null,
            status: 'active', // Auto-approved
            createdBy: req.user._id
        });

        await driver.save();

        res.status(201).json({
            success: true,
            message: 'Driver added successfully',
            driver
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get drivers
router.get('/drivers', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        const drivers = await Driver.find(query)
            .populate('createdBy', 'businessName email')
            .sort({ createdAt: -1 });

        res.json({ drivers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete driver
router.delete('/drivers/:id', protect, async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Check access (user can delete own, admin can delete any)
        if (req.user.role !== 'admin' && driver.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete photo from filesystem
        if (driver.photo && fs.existsSync(driver.photo)) {
            fs.unlinkSync(driver.photo);
        }

        await Driver.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Driver deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
