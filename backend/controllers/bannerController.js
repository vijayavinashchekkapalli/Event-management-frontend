const { Readable } = require('stream');
const Banner = require('../models/Banner');
const getCloudinary = require('../config/cloudinary');

const MAX_BANNERS = Number(process.env.BANNER_MAX_COUNT || 8);

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

function normalizeLink(link) {
  if (!link) return '';
  const trimmed = String(link).trim();
  return trimmed;
}

function validatePayload({ title, link }) {
  if (title && String(title).length > 80) {
    return 'Title must be 80 characters or less';
  }

  if (link) {
    const value = String(link).trim();
    if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) {
      return 'Link must be a valid URL or a relative path';
    }
  }

  return null;
}

exports.getActiveBanners = async (req, res) => {
  try {
    // Cache banners for 5 minutes to reduce DB load
    const banners = await Banner.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('imageUrl title link registrationLink whatsappGroupLink upiId upiAmount upiImageUrl upiQrEnabled upiIdEnabled announcement isActive createdAt')
      .maxTimeMS(15000)  // Add timeout
      .lean()
      .limit(8);

    res.set('Cache-Control', 'public, max-age=300');
    res.json({ banners: banners || [] });
  } catch (error) {
    console.error('[bannerController] getActiveBanners error:', error.message);
    res.status(500).json({ message: 'Failed to load banners', error: error.message });
  }
};

exports.getActiveBannerConfig = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .select('imageUrl title link registrationLink whatsappGroupLink upiId upiAmount upiImageUrl upiQrEnabled upiIdEnabled announcement isActive createdAt')
      .maxTimeMS(15000)
      .lean();

    if (!banner) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.status(404).json({ message: 'No active banner found' });
    }

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      ...banner,
      whatsappLink: banner.whatsappGroupLink || '',
      upiScannerImage: banner.upiImageUrl || '',
      upiQrEnabled: banner.upiQrEnabled !== false,
      upiIdEnabled: banner.upiIdEnabled !== false
    });
  } catch (error) {
    console.error('[bannerController] getActiveBannerConfig error:', error.message);
    res.status(500).json({ message: 'Failed to load active banner', error: error.message });
  }
};

exports.getWhatsAppGroupLink = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .select('whatsappGroupLink')
      .maxTimeMS(10000)
      .lean();

    const whatsappGroupLink = banner?.whatsappGroupLink || '';
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ whatsappGroupLink, found: Boolean(banner) });
  } catch (error) {
    console.error('[bannerController] getWhatsAppGroupLink error:', error.message);
    res.status(500).json({ message: 'Failed to load WhatsApp group link', error: error.message });
  }
};

exports.getAdminBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .select('_id imageUrl publicId title link registrationLink whatsappGroupLink upiId upiAmount upiImageUrl upiQrEnabled upiIdEnabled announcement isActive createdAt')
      .maxTimeMS(15000)
      .lean();

    console.log(`[bannerController] getAdminBanners fetched ${banners.length} banners`);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ banners: banners || [] });
  } catch (error) {
    console.error('[bannerController] getAdminBanners error:', error.message);
    res.status(500).json({ message: 'Failed to load banners', error: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    // Support either single-file (req.file) or multer.fields (req.files)
    const mainFile = req.file || (req.files && req.files.image && req.files.image[0]);

    if (!mainFile) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const total = await Banner.countDocuments().maxTimeMS(10000);
    if (total >= MAX_BANNERS) {
      return res.status(400).json({ message: `Maximum of ${MAX_BANNERS} banners allowed` });
    }

    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await uploadToCloudinary(mainFile.buffer, {
      folder: 'event-management/banners',
      resource_type: 'image',
      transformation: [
        { width: 1600, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ]
    });

    // Optional UPI image
    let upiResult = null;
    const upiFile = req.files && req.files.upiImage && req.files.upiImage[0];
    if (upiFile) {
      try {
        upiResult = await uploadToCloudinary(upiFile.buffer, {
          folder: 'event-management/banners/upi',
          resource_type: 'image',
          transformation: [ { width: 800, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' } ]
        });
      } catch (upiErr) {
        console.error('[bannerController] UPI image upload failed:', upiErr.message);
        // Don't fail banner creation if UPI image fails
      }
    }

    const whatsappGroupLink = normalizeLink(req.body.whatsappGroupLink);
    const registrationLink = normalizeLink(req.body.registrationLink);
    const upiQrEnabled = typeof req.body.upiQrEnabled === 'undefined'
      ? true
      : !['false', '0', 'off', 'no'].includes(String(req.body.upiQrEnabled).trim().toLowerCase());
    const upiIdEnabled = typeof req.body.upiIdEnabled === 'undefined'
      ? true
      : !['false', '0', 'off', 'no'].includes(String(req.body.upiIdEnabled).trim().toLowerCase());

    const banner = await Banner.create({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      title: String(req.body.title || '').trim(),
      link: normalizeLink(req.body.link),
      registrationLink: registrationLink,
      whatsappGroupLink: whatsappGroupLink,
      upiId: String(req.body.upiId || '').trim(),
      upiAmount: String(req.body.upiAmount || '').trim(),
      upiImageUrl: upiResult ? upiResult.secure_url : '',
      upiImagePublicId: upiResult ? upiResult.public_id : '',
      upiQrEnabled,
      upiIdEnabled,
      announcement: String(req.body.announcement || '').trim(),
      isActive: String(req.body.isActive).toLowerCase() !== 'false'
    });

    console.log('[bannerController] Banner created:', banner._id.toString());
    res.status(201).json({ message: 'Banner created', banner });
  } catch (error) {
    console.error('[bannerController] createBanner error:', error.message);
    res.status(500).json({ message: 'Failed to create banner', error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id).maxTimeMS(10000);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'event-management/banners',
        resource_type: 'image',
        transformation: [
          { width: 1600, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      });

      try {
        await getCloudinary().uploader.destroy(banner.publicId, { resource_type: 'image' });
      } catch (delErr) {
        console.warn('[bannerController] Failed to delete old banner image:', delErr.message);
      }

      banner.imageUrl = result.secure_url;
      banner.publicId = result.public_id;
    }

    // If admin uploaded a new UPI image
    const upiFile = req.files && req.files.upiImage && req.files.upiImage[0];
    if (upiFile) {
      try {
        const upiResult = await uploadToCloudinary(upiFile.buffer, {
          folder: 'event-management/banners/upi',
          resource_type: 'image',
          transformation: [ { width: 800, crop: 'limit' }, { quality: 'auto:good', fetch_format: 'auto' } ]
        });

        if (banner.upiImagePublicId) {
          try {
            await getCloudinary().uploader.destroy(banner.upiImagePublicId, { resource_type: 'image' });
          } catch (delErr) {
            console.warn('[bannerController] Failed to delete old UPI image:', delErr.message);
          }
        }

        banner.upiImageUrl = upiResult.secure_url;
        banner.upiImagePublicId = upiResult.public_id;
      } catch (upiErr) {
        console.error('[bannerController] UPI image update failed:', upiErr.message);
      }
    }

    if (typeof req.body.title !== 'undefined') {
      banner.title = String(req.body.title || '').trim();
    }

    if (typeof req.body.link !== 'undefined') {
      banner.link = normalizeLink(req.body.link);
    }

    if (typeof req.body.registrationLink !== 'undefined') {
      banner.registrationLink = normalizeLink(req.body.registrationLink);
    }

    if (typeof req.body.whatsappGroupLink !== 'undefined') {
      banner.whatsappGroupLink = normalizeLink(req.body.whatsappGroupLink);
    }

    if (typeof req.body.upiId !== 'undefined') {
      banner.upiId = String(req.body.upiId || '').trim();
    }

    if (typeof req.body.upiAmount !== 'undefined') {
      banner.upiAmount = String(req.body.upiAmount || '').trim();
    }

    if (typeof req.body.upiQrEnabled !== 'undefined') {
      banner.upiQrEnabled = !['false', '0', 'off', 'no'].includes(String(req.body.upiQrEnabled).trim().toLowerCase());
    }

    if (typeof req.body.upiIdEnabled !== 'undefined') {
      banner.upiIdEnabled = !['false', '0', 'off', 'no'].includes(String(req.body.upiIdEnabled).trim().toLowerCase());
    }

    if (typeof req.body.announcement !== 'undefined') {
      banner.announcement = String(req.body.announcement || '').trim();
    }

    if (typeof req.body.isActive !== 'undefined') {
      banner.isActive = String(req.body.isActive).toLowerCase() === 'true';
    }

    await banner.save();
    console.log('[bannerController] Banner updated:', banner._id.toString());
    res.json({ message: 'Banner updated', banner });
  } catch (error) {
    console.error('[bannerController] updateBanner error:', error.message);
    res.status(500).json({ message: 'Failed to update banner', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id).maxTimeMS(10000);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    if (banner.publicId) {
      try {
        await getCloudinary().uploader.destroy(banner.publicId, { resource_type: 'image' });
      } catch (delErr) {
        console.warn('[bannerController] Failed to delete banner image:', delErr.message);
      }
    }

    if (banner.upiImagePublicId) {
      try {
        await getCloudinary().uploader.destroy(banner.upiImagePublicId, { resource_type: 'image' });
      } catch (delErr) {
        console.warn('[bannerController] Failed to delete UPI image:', delErr.message);
      }
    }

    await banner.deleteOne();
    console.log('[bannerController] Banner deleted:', id);
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    console.error('[bannerController] deleteBanner error:', error.message);
    res.status(500).json({ message: 'Failed to delete banner', error: error.message });
  }
};
