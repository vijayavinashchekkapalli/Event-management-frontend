const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
    registrationLink: { type: String, trim: true, default: '' },
    whatsappGroupLink: { type: String, trim: true, default: '' },
    upiId: { type: String, trim: true, default: '' },
    upiAmount: { type: String, trim: true, default: '' },
    upiImageUrl: { type: String, trim: true, default: '' },
    upiImagePublicId: { type: String, trim: true, default: '' },
    upiQrEnabled: { type: Boolean, default: true },
    upiIdEnabled: { type: Boolean, default: true },
    announcement: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Banner', bannerSchema);
