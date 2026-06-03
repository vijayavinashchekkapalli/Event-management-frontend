# Forgot Password & Username System Documentation

## Overview
Complete authentication system for "Forgot Password" and "Forgot Username" with secure token management and email notifications using Nodemailer.

---

## Features

### 1. **Forgot Username**
- User enters registered email
- System verifies email exists
- Sends username via email
- 24-hour friendly email template

### 2. **Forgot Password**
- User enters registered email
- System generates secure token (32-byte hex)
- Token expires in 15 minutes for security
- Sends password reset link via email
- User clicks link to reset password

### 3. **Security**
- Passwords hashed with bcrypt (salt: 10)
- Reset tokens are hashed before storage
- Tokens expire automatically after 15 minutes
- No sensitive data in emails
- Email validation and sanitization

---

## Database Schema (User Model)

```javascript
{
  username: String (unique, required, lowercase)
  email: String (unique, required, lowercase)
  password: String (hashed, required, selected separately)
  firstName: String
  middleName: String
  lastName: String
  phone: String (unique, required)
  uid: String
  isAdmin: Boolean
  passwordResetToken: String (hashed token, not selected by default)
  passwordResetExpires: Date (expiry timestamp)
  timestamps: true
}
```

---

## API Endpoints

### 1. User Registration
**POST** `/api/signup`

Request:
```json
{
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

Response (Success):
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

---

### 2. User Login
**POST** `/api/login`

Request:
```json
{
  "identifier": "john_doe",  // Can be username, email, or phone
  "password": "SecurePass123"
}
```

Response (Success):
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

---

### 3. Forgot Username
**POST** `/api/forgot-username`

Request:
```json
{
  "email": "john@example.com"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "If an account exists with this email, the username has been sent to your inbox."
}
```

**Email Template:**
- Subject: "Your StartInno Solutions Username"
- Shows username in styled card
- Includes contact info

---

### 4. Forgot Password
**POST** `/api/forgot-password`

Request:
```json
{
  "email": "john@example.com"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent to your inbox."
}
```

**Email Template:**
- Subject: "Reset Your StartInno Solutions Password"
- Reset link: `http://localhost:3000/reset-password/{token}`
- Link expires in 15 minutes
- Includes warning about expiry

---

### 5. Validate Reset Token
**GET** `/api/validate-reset-token/:token`

Response (Valid):
```json
{
  "success": true,
  "message": "Token is valid. Proceed to reset password."
}
```

Response (Invalid/Expired):
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

---

### 6. Reset Password
**POST** `/api/reset-password/:token`

Request:
```json
{
  "password": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

---

## Frontend Pages

### 1. **Forgot Username Page** (`forgot-username.html`)
- Professional card-based design
- Input field for email
- Real-time validation
- Success/Error messages
- Loading indicator
- Links to Login, Forgot Password

### 2. **Forgot Password Page** (`forgot-password.html`)
- Professional card-based design
- Input field for email
- Info banner about 15-minute expiry
- Real-time validation
- Success/Error messages
- Loading indicator
- Links to Login, Forgot Username

### 3. **Reset Password Page** (`reset-password.html`)
- Validates token on page load
- Password strength indicator (Weak/Fair/Good)
- Password confirmation field
- Real-time password matching validation
- Success screen with animated checkmark
- Automatic redirect to login on success

### 4. **Updated Login Page**
- Changed "email" input to "identifier" (accepts username/email/phone)
- Added "Forgot Password" button
- Added "Forgot Username" button
- Removed Firebase modal (now separate pages)
- Updated to use MongoDB backend

---

## Environment Variables

Add to `.env` file:

```env
# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_secret_key

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup:
1. Enable 2-Factor Authentication
2. Generate "App Password" from Google Account
3. Use App Password in `EMAIL_PASS`
4. Do NOT use your regular Gmail password

---

## Installation

### Backend Dependencies
```bash
npm install nodemailer
npm install bcryptjs
npm install crypto
```

### Files Modified/Created

**Backend:**
- ✅ `backend/models/User.js` - Updated schema
- ✅ `backend/config/nodemailer.js` - Email configuration
- ✅ `backend/controllers/userController.js` - All auth logic
- ✅ `backend/routes/userRoutes.js` - All endpoints

**Frontend:**
- ✅ `frontend/user/login.html` - Updated login
- ✅ `frontend/user/forgot-username.html` - New page
- ✅ `frontend/user/forgot-password.html` - New page
- ✅ `frontend/user/reset-password.html` - New page

---

## Security Checklist

✅ Passwords hashed with bcrypt (10 salt rounds)
✅ Reset tokens are 32-byte cryptographic random hex
✅ Tokens hashed before database storage
✅ Token expiry: 15 minutes
✅ Email validation: RFC 5322 compliant regex
✅ No sensitive data in emails
✅ Password strength requirements: Min 6 characters
✅ Input sanitization and validation
✅ Error messages don't reveal if email exists (404 treated same as error)
✅ HTTPS recommended for production
✅ Rate limiting recommended for forgot endpoints

---

## Testing Flow

### Test Forgot Username:
1. Navigate to `/forgot-username.html`
2. Enter a registered email
3. Check email inbox for username
4. Verify email contains username in styled card

### Test Forgot Password:
1. Navigate to `/forgot-password.html`
2. Enter a registered email
3. Check email inbox for reset link
4. Click link (within 15 minutes)
5. Should redirect to `/reset-password.html` with token
6. Enter new password (with strength indicator)
7. Confirm password matches
8. Click "Reset Password"
9. Should show success and redirect to login
10. Login with new password

### Test Security:
1. Generate reset token
2. Wait >15 minutes
3. Try to reset password
4. Should get "Token expired" error

---

## Error Handling

### Forgot Username:
- ✅ Email required
- ✅ Invalid email format
- ✅ Email not found (generic message for security)

### Forgot Password:
- ✅ Email required
- ✅ Invalid email format
- ✅ Email not found (generic message for security)

### Reset Password:
- ✅ Token required
- ✅ Invalid token
- ✅ Expired token (>15 minutes)
- ✅ Password required
- ✅ Password too short (<6 chars)
- ✅ Passwords don't match
- ✅ Server errors

---

## Production Checklist

- [ ] Set `EMAIL_USER` and `EMAIL_PASS` in production env
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS on reset link
- [ ] Implement rate limiting on forgot endpoints
- [ ] Set up email service monitoring
- [ ] Test email delivery to spam folder
- [ ] Configure JWT secret in production
- [ ] Enable CORS for production domain
- [ ] Monitor password reset attempts (logs)
- [ ] Set up email bounce handling

---

## Example Usage

### Complete Auth Flow:
```javascript
// 1. User signs up
POST /api/signup
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// 2. User forgets password
POST /api/forgot-password
{ "email": "john@example.com" }
// User receives email with reset link

// 3. User clicks email link
// Lands on /reset-password.html?token=abc123def456...

// 4. User validates token
GET /api/validate-reset-token/abc123def456...

// 5. User enters new password
POST /api/reset-password/abc123def456...
{
  "password": "NewPass456",
  "confirmPassword": "NewPass456"
}

// 6. User logs in with new password
POST /api/login
{
  "identifier": "john_doe",
  "password": "NewPass456"
}
```

---

## Troubleshooting

### Emails not sending:
1. Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
2. Verify Gmail has "Less secure app access" enabled OR App Password configured
3. Check network connectivity
4. Monitor server logs for email errors

### Reset token invalid:
1. Token expires after 15 minutes
2. User must request new reset link
3. Verify token in database hasn't been cleared

### Password reset fails:
1. Check password meets minimum length (6 chars)
2. Verify passwords match
3. Ensure token is within 15-minute window

---

## Support

For issues or questions:
- Email: askconnect4@gmail.com
- Check server logs: `backend/server.js` error logs
- Verify `.env` configuration
- Test email service manually

