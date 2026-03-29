import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        unique: true, 
        uppercase: true, 
        required: true,
        trim: true
    },
    discount_amount: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    },
    max_uses: { 
        type: Number, 
        default: null 
    },
    used_count: { 
        type: Number, 
        default: 0 
    },
    per_user_limit: { 
        type: Number, 
        default: 1 
    },
    minimum_order_value: { 
        type: Number, 
        default: 0 
    },
    expires_at: { 
        type: Date, 
        default: null 
    },
    description: { 
        type: String,
        default: ''
    },
    created_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model('PromoCode', promoCodeSchema);
