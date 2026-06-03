const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      index: true
    },
    phone: { 
      type: String, 
      required: true, 
      trim: true, 
      unique: true,
      index: true
    },
    collegeName: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    yearOfStudy: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    password: { type: String, required: true, select: false },
    uid: { type: String, index: true, sparse: true },
    isAdmin: { type: Boolean, default: false, select: false, index: true },
    passwordResetToken: { type: String, select: false, sparse: true },
    passwordResetExpires: { type: Date, select: false }
  },
  { 
    timestamps: true,
    // Enable compound index for common queries
    index: [
      { email: 1, isAdmin: 1 },
      { username: 1, isAdmin: 1 }
    ]
  }
);

// Optimize for login queries
userSchema.index({ username: 1, isAdmin: 1 });
userSchema.index({ email: 1, isAdmin: 1 });
userSchema.index({ phone: 1, isAdmin: 1 });

module.exports = mongoose.model('User', userSchema);