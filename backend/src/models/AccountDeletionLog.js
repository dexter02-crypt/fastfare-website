import mongoose from 'mongoose';

const accountDeletionLogSchema = new mongoose.Schema({
    deleted_user_email: {
        type: String,
        required: true,
        trim: true
    },
    deleted_by: {
        type: String, // 'self' or admin_id
        required: true
    },
    account_type: {
        type: String,
        enum: ['user', 'partner', 'driver'],
        required: true
    },
    deleted_at: {
        type: Date,
        default: Date.now
    }
});

const AccountDeletionLog = mongoose.model('AccountDeletionLog', accountDeletionLogSchema);

export default AccountDeletionLog;
