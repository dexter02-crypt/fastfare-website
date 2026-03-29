import mongoose from 'mongoose';

const accountDeletionOtpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp_hash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  used: {
    type: Boolean,
    default: false
  },
  expires_at: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Ensure we can auto-expire documents if needed, though we will also manually check expires_at
accountDeletionOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const AccountDeletionOtp = mongoose.model('AccountDeletionOtp', accountDeletionOtpSchema);
