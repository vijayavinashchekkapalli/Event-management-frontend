const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  teamName: { type: String, index: true },
  leaderName: { type: String, index: true },
  email: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
  year: { type: String, index: true },
  stream: { type: String, index: true },
  collegeName: { type: String, default: '', index: true },
  contact: { type: String, index: true },
  members: Array,
  paymentMethod: { type: String, default: '', index: true },
  paymentReference: { type: String, default: '', index: true },
  transactionId: { type: String, default: '', index: true },
  paymentSubmissionId: { type: String, default: '', index: true },
  paymentScreenshotUrl: { type: String, default: '' },
  paymentScreenshotPublicId: { type: String, default: '' },
  paymentSubmittedAt: { type: Date, default: null },
  paymentVerificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  paymentReviewNote: { type: String, default: '' },
  paymentReviewedAt: { type: Date, default: null },
  upiMethod: { type: String, trim: true, default: '' },
  paymentStatus: {
    type: String,
    trim: true,
    default: 'pending'
  },
  whatsappJoined: { type: Boolean, default: false, index: true },
  whatsappInviteLink: { type: String, default: '' },
  userId: { type: String, index: true },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null }
}, { timestamps: true });

// Compound indexes for common queries
teamSchema.index({ leaderName: 1, email: 1 });
teamSchema.index({ teamName: 1 });
teamSchema.index({ userId: 1, registrationStatus: 1 });
teamSchema.index({ stream: 1, year: 1, registrationStatus: 1 });
teamSchema.index({ registrationStatus: 1, createdAt: -1 });
teamSchema.index({ email: 1, registrationStatus: 1 });

module.exports = mongoose.model("Team", teamSchema);