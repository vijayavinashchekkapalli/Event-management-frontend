# Forgot Password System - Quick Setup Guide

## 1. Install Dependencies

```bash
cd backend
npm install nodemailer
```

## 2. Update .env File

Add these variables to your `.env`:

```env
# Gmail SMTP Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for reset links in emails)
FRONTEND_URL=http://localhost:3000
```

### How to get Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to "App passwords" → Select "Mail" → Select "Windows Computer" (or your device)
4. Copy the 16-character password
5. Use this as `EMAIL_PASS` (remove spaces)

## 3. Verify User Schema Update

Check that `backend/models/User.js` includes:
- `username` field (unique, required)
- `email` field (unique, required)
- `passwordResetToken` field
- `passwordResetExpires` field

## 4. Test Email Configuration

Run this test in Node:

```bash
node -e "
const { verifyEmailConfiguration } = require('./backend/config/nodemailer');
verifyEmailConfiguration().then(result => {
  if (result) console.log('✓ Email configured correctly');
  else console.log('✗ Email configuration failed');
});
"
```

## 5. Signup Process - Test with Username

Visit `frontend/user/signup.html` and register with:
- Username: `testuser`
- Email: `your_email@gmail.com`
- Phone: `9876543210`
- Password: `Test@123`

## 6. Test Forgot Username

1. Go to `frontend/user/forgot-username.html`
2. Enter your registered email
3. Check email inbox for username

## 7. Test Forgot Password

1. Go to `frontend/user/forgot-password.html`
2. Enter your registered email
3. Check email inbox for reset link
4. Click reset link (valid for 15 minutes)
5. Enter new password
6. Click "Reset Password"
7. Should see success screen
8. Login with new password at `frontend/user/login.html`

## 8. API Endpoints

Test with curl or Postman:

### Signup
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "Test@123",
    "confirmPassword": "Test@123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "Test@123"
  }'
```

### Forgot Username
```bash
curl -X POST http://localhost:5000/api/forgot-username \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Forgot Password
```bash
curl -X POST http://localhost:5000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:5000/api/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPass@456",
    "confirmPassword": "NewPass@456"
  }'
```

## 9. Email Templates

Both emails use professional HTML templates with:
- Company branding
- Clear call-to-action buttons
- Responsive design (mobile-friendly)
- Contact information
- Security warnings (for password reset)

## 10. Security Notes

- Tokens expire in **15 minutes**
- Passwords hashed with **bcrypt** (10 salt rounds)
- Tokens are **32-byte cryptographic random** values
- Reset tokens stored as **SHA256 hashes** in DB
- Emails don't reveal sensitive information
- Error messages don't leak account existence

## 11. Frontend Pages

All pages have:
- Professional card-based design
- Real-time validation
- Loading indicators
- Success/error messages
- Responsive mobile design
- Smooth animations

### Forgot Username Page
- File: `frontend/user/forgot-username.html`
- URL: `http://localhost:3000/forgot-username.html`

### Forgot Password Page
- File: `frontend/user/forgot-password.html`
- URL: `http://localhost:3000/forgot-password.html`

### Reset Password Page
- File: `frontend/user/reset-password.html`
- URL: `http://localhost:3000/reset-password.html?token=XXX`

### Updated Login Page
- File: `frontend/user/login.html`
- Buttons link to forgot pages
- Accepts username/email/phone as identifier

## 12. Troubleshooting

### Emails not sending?
1. Verify `EMAIL_USER` and `EMAIL_PASS` in .env
2. Check Gmail has App Password (not regular password)
3. Verify 2-Factor Authentication is enabled
4. Check network connectivity

### Reset link not working?
1. Token expires after 15 minutes - get a new one
2. Make sure `FRONTEND_URL` matches where you're accessing from
3. Check browser console for errors

### Password reset fails?
1. Ensure password is at least 6 characters
2. Verify passwords match exactly
3. Check token hasn't expired

### Can't login after reset?
1. Try using username instead of email
2. Verify new password was saved
3. Check for typos in password

## 13. Production Deployment

Before going live:
1. Set `FRONTEND_URL` to your production domain
2. Use environment-specific .env files
3. Enable rate limiting on forgot endpoints
4. Set up email bounce handling
5. Configure HTTPS (required for passwords)
6. Monitor email delivery rates
7. Set up error logging
8. Test all flows end-to-end

## 14. File Locations

**Backend:**
- `backend/models/User.js` - Schema
- `backend/config/nodemailer.js` - Email setup
- `backend/controllers/userController.js` - Auth logic
- `backend/routes/userRoutes.js` - API routes

**Frontend:**
- `frontend/user/login.html` - Updated
- `frontend/user/forgot-username.html` - New
- `frontend/user/forgot-password.html` - New
- `frontend/user/reset-password.html` - New

**Documentation:**
- `FORGOT_PASSWORD_DOCUMENTATION.md` - Full docs
- This file - Quick setup guide

## 15. Support

For issues:
1. Check server logs: `npm run dev`
2. Check browser console (F12)
3. Verify .env configuration
4. Test email manually
5. Review error messages in responses

---

**Status**: ✅ Ready to use
**Security Level**: Production-grade
**Email Provider**: Gmail SMTP
**Token Expiry**: 15 minutes
**Password Requirements**: Min 6 characters
