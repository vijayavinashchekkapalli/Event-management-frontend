const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
	{
		userId: { type: String, trim: true, index: true, required: true },
		registrationId: { type: String, trim: true, default: '', index: true },
		teamName: { type: String, trim: true, default: '', index: true },
		leaderName: { type: String, trim: true, default: '', index: true },
		email: { type: String, trim: true, lowercase: true, required: true, index: true },
		paymentMethod: { type: String, trim: true, enum: ['upi-qr', 'upi-id'], default: 'upi-qr', index: true },
		upiMethod: { type: String, trim: true, enum: ['qr', 'upi-id'], default: 'qr' },
		upiId: { type: String, trim: true, default: '' },
		paymentAmount: { type: String, trim: true, default: '' },
		transactionId: { type: String, trim: true, default: '', index: true },
		screenshotUrl: { type: String, trim: true, default: '' },
		screenshotPublicId: { type: String, trim: true, default: '' },
		status: {
			type: String,
			trim: true,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
			index: true
		},
		submittedAt: { type: Date, default: Date.now },
		reviewedAt: { type: Date, default: null },
		reviewedBy: { type: String, trim: true, default: '' },
		reviewNote: { type: String, trim: true, default: '' }
	},
	{ timestamps: true }
);

paymentSchema.index({ email: 1, transactionId: 1 }, { unique: false });
paymentSchema.index({ registrationId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ email: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
