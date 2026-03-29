import mongoose from 'mongoose';

const partnerTeamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    role: { type: String, default: 'member' }
}, { timestamps: true });

const PartnerTeam = mongoose.model('PartnerTeam', partnerTeamSchema);

export default PartnerTeam;
