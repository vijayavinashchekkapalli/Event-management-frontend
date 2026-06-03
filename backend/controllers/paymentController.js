const { Readable } = require('stream');
const Banner = require('../models/Banner');
const Payment = require('../models/Payment');
const Team = require('../models/Team');
const getCloudinary = require('../config/cloudinary');
const { invalidateDashboardCache } = require('../config/redis');

function uploadToCloudinary(buffer, options = {}) {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    Readable.from(buffer).pipe(stream);
  });
}

function normalizeEnabledFlag(value, fallback = true) {
  if (typeof value === 'undefined' || value === null || value === '') return fallback;
  return !['false', '0', 'off', 'no'].includes(String(value).trim().toLowerCase());
}

async function getActiveBannerDoc() {
  return Banner.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .select('imageUrl title link registrationLink whatsappGroupLink upiId upiAmount upiImageUrl upiImagePublicId upiQrEnabled upiIdEnabled announcement isActive createdAt')
    .maxTimeMS(15000)
    .lean();
}

exports.getPaymentSettings = async (req, res) => {
  try {
    const banner = await getActiveBannerDoc();
    if (!banner) {
      return res.status(404).json({ message: 'No active payment settings found' });
    }

    res.json({
      paymentSettings: {
        upiId: banner.upiId || '',
        upiAmount: banner.upiAmount || '',
        upiImageUrl: banner.upiImageUrl || '',
        upiQrEnabled: banner.upiQrEnabled !== false,
        upiIdEnabled: banner.upiIdEnabled !== false,
        whatsappGroupLink: banner.whatsappGroupLink || ''
      }
    });
  } catch (error) {
    console.error('[paymentController] getPaymentSettings error:', error.message);
    res.status(500).json({ message: 'Failed to load payment settings', error: error.message });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!banner) {
      return res.status(404).json({ message: 'No active banner found to update' });
    }

    if (typeof req.body.upiId !== 'undefined') banner.upiId = String(req.body.upiId || '').trim();
    if (typeof req.body.upiAmount !== 'undefined') banner.upiAmount = String(req.body.upiAmount || '').trim();
    if (typeof req.body.upiQrEnabled !== 'undefined') banner.upiQrEnabled = normalizeEnabledFlag(req.body.upiQrEnabled, true);
    if (typeof req.body.upiIdEnabled !== 'undefined') banner.upiIdEnabled = normalizeEnabledFlag(req.body.upiIdEnabled, true);

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'event-management/banners/upi',
        resource_type: 'image',
        transformation: [
          { width: 800, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      });

      if (banner.upiImagePublicId) {
        try {
          await getCloudinary().uploader.destroy(banner.upiImagePublicId, { resource_type: 'image' });
        } catch (destroyError) {
          console.warn('[paymentController] Failed to delete old UPI image:', destroyError.message);
        }
      }

      banner.upiImageUrl = result.secure_url;
      banner.upiImagePublicId = result.public_id;
    }

    await banner.save();
    await invalidateDashboardCache();

    res.json({
      message: 'Payment settings updated',
      paymentSettings: {
        upiId: banner.upiId || '',
        upiAmount: banner.upiAmount || '',
        upiImageUrl: banner.upiImageUrl || '',
        upiQrEnabled: banner.upiQrEnabled !== false,
        upiIdEnabled: banner.upiIdEnabled !== false,
        whatsappGroupLink: banner.whatsappGroupLink || ''
      }
    });
  } catch (error) {
    console.error('[paymentController] updatePaymentSettings error:', error.message);
    res.status(500).json({ message: 'Failed to update payment settings', error: error.message });
  }
};

exports.submitUpiPayment = async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?.uid || req.user?.email || '').trim();
    const teamName = String(req.body.teamName || '').trim();
    const leaderName = String(req.body.leaderName || req.body.teamLeaderName || '').trim();
    const email = String(req.body.email || req.body.leaderEmail || '').trim().toLowerCase();
    const paymentMethod = String(req.body.paymentMethod || 'upi-qr').trim().toLowerCase();
    const upiMethod = String(req.body.upiMethod || 'qr').trim().toLowerCase();
    const upiId = String(req.body.upiId || '').trim();
    const paymentAmount = String(req.body.paymentAmount || '').trim();
    const transactionId = String(req.body.transactionId || '').trim();
    const registrationId = String(req.body.registrationId || '').trim();
    const screenshotFile = req.file;

    if (!userId || !email || !teamName || !leaderName) {
      return res.status(400).json({ message: 'Missing required payment fields' });
    }

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const existingTransaction = await Payment.findOne({ transactionId }).maxTimeMS(10000).lean();
    if (existingTransaction) {
      return res.status(409).json({ message: 'This transaction ID has already been submitted' });
    }

    let screenshotUrl = '';
    let screenshotPublicId = '';
    if (screenshotFile) {
      const result = await uploadToCloudinary(screenshotFile.buffer, {
        folder: 'event-management/payments',
        resource_type: 'image',
        transformation: [
          { width: 1400, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      });
      screenshotUrl = result.secure_url;
      screenshotPublicId = result.public_id;
    }

    const payment = await Payment.create({
      userId,
      registrationId,
      teamName,
      leaderName,
      email,
      paymentMethod,
      upiMethod,
      upiId,
      paymentAmount,
      transactionId,
      screenshotUrl,
      screenshotPublicId,
      status: 'pending',
      submittedAt: new Date()
    });

    const matchingTeamQuery = registrationId
      ? { _id: registrationId }
      : { $or: [{ userId }, { email }] };
    const matchingTeam = await Team.findOne(matchingTeamQuery).sort({ createdAt: -1 });
    if (matchingTeam) {
      matchingTeam.paymentMethod = payment.paymentMethod;
      matchingTeam.upiMethod = payment.upiMethod;
      matchingTeam.paymentReference = payment.transactionId;
      matchingTeam.transactionId = payment.transactionId;
      matchingTeam.paymentSubmissionId = String(payment._id);
      matchingTeam.paymentScreenshotUrl = payment.screenshotUrl;
      matchingTeam.paymentScreenshotPublicId = payment.screenshotPublicId;
      matchingTeam.paymentSubmittedAt = payment.submittedAt;
      matchingTeam.paymentVerificationStatus = payment.status;
      matchingTeam.paymentStatus = payment.status;
      await matchingTeam.save();
    }

    await invalidateDashboardCache();

    res.status(201).json({
      message: 'Payment submitted for verification',
      payment
    });
  } catch (error) {
    console.error('[paymentController] submitUpiPayment error:', error.message);
    res.status(500).json({ message: 'Failed to submit payment', error: error.message });
  }
};

exports.getPaymentVerificationStatus = async (req, res) => {
  try {
    const paymentId = String(req.params.id || req.query.paymentId || '').trim();
    const registrationId = String(req.query.registrationId || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    let payment = null;
    if (paymentId) {
      payment = await Payment.findById(paymentId).maxTimeMS(10000).lean();
    } else if (registrationId) {
      payment = await Payment.findOne({ registrationId }).sort({ createdAt: -1 }).maxTimeMS(10000).lean();
    } else if (email) {
      payment = await Payment.findOne({ email }).sort({ createdAt: -1 }).maxTimeMS(10000).lean();
    }

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('[paymentController] getPaymentVerificationStatus error:', error.message);
    res.status(500).json({ message: 'Failed to load payment status', error: error.message });
  }
};

exports.reviewPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const status = String(req.body.status || '').trim().toLowerCase();
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    payment.status = status;
    payment.reviewedAt = new Date();
    payment.reviewNote = String(req.body.reviewNote || '').trim();
    payment.reviewedBy = String(req.user?.email || req.user?.id || req.user?.uid || 'admin').trim();
    await payment.save();

    const team = await Team.findOne({ paymentSubmissionId: String(payment._id) });
    if (team) {
      team.paymentVerificationStatus = status;
      team.paymentStatus = status;
      team.paymentReviewedAt = payment.reviewedAt;
      team.paymentReviewNote = payment.reviewNote;
      await team.save();
    }

    await invalidateDashboardCache();
    res.json({ message: `Payment ${status}`, payment });
  } catch (error) {
    console.error('[paymentController] reviewPayment error:', error.message);
    res.status(500).json({ message: 'Failed to review payment', error: error.message });
  }
};