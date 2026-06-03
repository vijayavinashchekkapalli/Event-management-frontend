const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  issueType: { type: String, required: true },
  studentName: { type: String, required: true },
  contact: { type: String },
  email: { type: String },
  description: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected', 'not-started', 'completed'],
    default: 'not-started'
  },
  adminResponse: { type: String, default: '' },
  teamId: { type: String },
  userId: { type: String }
}, { timestamps: true });

issueSchema.index({ userId: 1, status: 1, createdAt: -1 });
issueSchema.index({ email: 1, status: 1, createdAt: -1 });
issueSchema.index({ teamId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
