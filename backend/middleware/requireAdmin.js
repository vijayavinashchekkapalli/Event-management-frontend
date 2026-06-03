const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    // If Firebase custom claims include admin flag, honor it
    if (req.user && req.user.admin) return next();

    // Try various identifiers to find a DB user: uid, phone, email
    const query = {};
    if (req.user && req.user.uid) query.uid = req.user.uid;
    if (req.user && req.user.phone_number) query.phone = req.user.phone_number;
    if (req.user && req.user.email) query.email = req.user.email;

    // If no identifier available, forbid
    if (!Object.keys(query).length) return res.status(403).json({ msg: 'Forbidden' });

    const user = await User.findOne(query).select('+isAdmin');
    if (user && user.isAdmin) return next();

    return res.status(403).json({ msg: 'Admin only' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

module.exports = requireAdmin;
