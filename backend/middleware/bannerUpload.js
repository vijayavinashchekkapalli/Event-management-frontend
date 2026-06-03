const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    return callback(new Error('Only image files are allowed'));
  }
  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.BANNER_MAX_FILE_SIZE || 5 * 1024 * 1024)
  }
});

module.exports = upload;
