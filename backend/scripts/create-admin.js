const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

async function createAdmin() {
  try {
    await connectDB();

    const phone = process.argv[2] || 'admin0001';
    const password = process.argv[3] || 'Admin@12345';
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'User';
    const username = process.argv[6] || String(phone).trim().toLowerCase();
    const email = process.argv[7] || `${String(phone).trim().toLowerCase()}@admin.co`;

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const update = {
      username,
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
      isAdmin: true
    };

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const user = await User.findOneAndUpdate({ phone }, update, opts).select('+isAdmin +password');

    console.log('Admin created/updated:');
    console.log('  id:', user._id.toString());
    console.log('  username:', user.username);
    console.log('  phone (username):', user.phone);
    console.log('  email:', user.email);
    console.log('  password:', password);

    // exit
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
