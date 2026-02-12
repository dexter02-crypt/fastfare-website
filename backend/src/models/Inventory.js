import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    brand: { type: String },

    images: [{ type: String }],

    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number
    },

    stock: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        damaged: { type: Number, default: 0 }
    },

    location: {
        zone: { type: String },
        aisle: { type: String },
        rack: { type: String },
        bin: { type: String }
    },

    price: { type: Number },
    costPrice: { type: Number },

    supplier: { type: String },

    reorderLevel: { type: Number, default: 10 },

}, { timestamps: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;
