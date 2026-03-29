import mongoose from 'mongoose';

const promoUsageSchema = new mongoose.Schema({
    promo_code: { 
        type: String, 
        required: true,
        uppercase: true,
        trim: true
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    shipment_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shipment', 
        required: true 
    },
    discount_applied: { 
        type: Number, 
        required: true 
    },
    used_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Index to quickly check how many times a user used a specific code
promoUsageSchema.index({ promo_code: 1, user_id: 1 });

export default mongoose.model('PromoUsage', promoUsageSchema);
