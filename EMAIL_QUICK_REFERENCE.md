# ⚡ Email Template Quick Reference Guide

## 🚀 Quick Start

### Email Template File Location
- **File**: `backend/config/mailer.js`
- **Functions**: 
  - `sendUsernameEmail(email, username)`
  - `sendPasswordResetEmail(email, resetToken, baseUrl)`

---

## 🎨 Brand Colors Quick Reference

```javascript
// Primary Colors
const COLORS = {
  background: '#0b1220',      // Dark navy (main background)
  card: '#111827',             // Dark slate (content area)
  primaryBlue: '#2563eb',      // Bright blue (buttons, accents)
  darkBlue: '#1d4ed8',         // Darker blue (gradient)
  darkerBlue: '#1e40af',       // Darkest blue (gradient end)
  accentBlue: '#60a5fa',       // Light blue (accent text)
  
  // Text Colors
  text: '#ffffff',             // White text
  secondaryText: '#d1d5db',    // Light gray text
  tertiaryText: '#9ca3af',     // Medium gray text
  footerText: '#6b7280',       // Footer gray text
  
  // Supporting Colors
  borderLight: '#e2e8f0',      // Light borders
  borderDark: '#1f2937',       // Dark dividers
};
```

---

## 🔗 Email Template Links

### Forgot Username Email
- **Subject**: `Your StartInno Solutions Username`
- **Trigger**: User enters email on forgot-username.html
- **Function**: `sendUsernameEmail(email, username)`

### Forgot Password Email
- **Subject**: `Reset Your StartInno Solutions Password`
- **Trigger**: User enters email on forgot-password.html
- **Function**: `sendPasswordResetEmail(email, resetToken, baseUrl)`

---

## 📝 Email Template Sections (Common)

### 1. Hero Section
```html
<tr>
    <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%); padding: 40px 20px; text-align: center;">
        <div style="font-size: 14px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; margin-bottom: 12px;">StartInno Solutions</div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.3; margin-bottom: 8px;">Your Title Here</h1>
        <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.95); line-height: 1.5;">Your subtitle here</p>
    </td>
</tr>
```

### 2. Main Content
```html
<tr>
    <td style="background: #111827; padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0; border-collapse: collapse;">
            <tr>
                <td style="padding: 40px 30px;">
                    <!-- Your content here -->
                </td>
            </tr>
        </table>
    </td>
</tr>
```

### 3. Footer Section
```html
<tr>
    <td style="background: #0b1220; padding: 24px 30px; border-top: 1px solid #1f2937; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #f3f4f6;">Need Help?</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">Contact StartInno Solutions Support</p>
        <p style="margin: 0; font-size: 13px;"><a href="mailto:support@startinnosolutions.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@startinnosolutions.com</a></p>
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #1f2937;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">© 2026 StartInno Solutions. All rights reserved.</p>
        </div>
    </td>
</tr>
```

---

## 🔘 Button Styles

### Primary CTA Button (Gradient with Shadow)
```html
<a href="YOUR_LINK_HERE" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">Button Text</a>
```

### Secondary Button (Simpler Style)
```html
<a href="YOUR_LINK_HERE" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 15px;">Button Text</a>
```

---

## 📦 Card Styles

### Username Card (Blue Gradient Border)
```html
<div style="margin: 32px 0; background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%); border: 1px solid #2563eb; border-radius: 12px; padding: 24px; text-align: center;">
    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #60a5fa; margin-bottom: 12px;">Card Label</div>
    <div style="font-size: 28px; font-weight: 700; color: #2563eb; font-family: 'Monaco', 'Courier New', monospace; letter-spacing: 0.05em; word-break: break-all;">Content Here</div>
</div>
```

### Info Card (Blue Left Border)
```html
<div style="margin: 28px 0; background: rgba(37, 99, 235, 0.08); border-left: 4px solid #2563eb; border-radius: 6px; padding: 16px; font-size: 13px; color: #9ca3af; line-height: 1.6;">
    <strong style="color: #60a5fa;">Icon Label:</strong> Your content here
</div>
```

### Security Card (Red Left Border)
```html
<div style="margin: 28px 0; background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; font-size: 13px; color: #9ca3af; line-height: 1.6;">
    <strong style="color: #f87171;">🔒 Label:</strong> Your security notice here
</div>
```

---

## 📋 Typography

### Heading 1 (Hero Title)
```css
font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.3;
```

### Heading 2 (Section Title)
```css
font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;
```

### Heading 3 (Subsection)
```css
font-size: 14px; font-weight: 600; color: #f3f4f6;
```

### Body Text (Main)
```css
font-size: 15px; color: #d1d5db; line-height: 1.6;
```

### Body Text (Secondary)
```css
font-size: 14px; color: #9ca3af; line-height: 1.6;
```

### Small Text (Footer)
```css
font-size: 13px; color: #6b7280; line-height: 1.6;
```

### Tiny Text (Copyright)
```css
font-size: 12px; color: #6b7280;
```

---

## 🔄 Common Modifications

### Change Button Color
```javascript
// Replace #2563eb with your color
background: linear-gradient(135deg, #YOUR_COLOR 0%, #DARKER_COLOR 100%);
```

### Change Hero Gradient
```javascript
// Modify the gradient direction and colors
background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
```

### Add Custom Brand Logo
```html
<!-- Add after brand name in hero -->
<img src="YOUR_LOGO_URL" alt="Logo" style="max-width: 200px; height: auto; margin: 12px 0;">
```

### Change Support Email
```javascript
// Replace in footer
<a href="mailto:support@startinnosolutions.com">support@startinnosolutions.com</a>
```

---

## 🔐 Security Features

### HTML Escaping
```javascript
// Use escapeHtml() for user input
${escapeHtml(username)}
${escapeHtml(email)}
${escapeHtml(userInput)}
```

### Link Format
```javascript
// Reset links should be formatted as:
http://localhost:5000/user/reset-password.html?token=${resetToken}

// Username login links:
http://localhost:5000/user/login.html
```

---

## 📱 Mobile Responsive Tips

### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Responsive Padding
```css
/* Desktop */
padding: 40px 30px;

/* Mobile - smaller padding */
padding: 30px 20px;
```

### Responsive Font Size
```css
/* Use appropriate sizes for mobile */
h1: 32px desktop, 24px mobile
body: 15px desktop, 14px mobile
small: 13px desktop, 12px mobile
```

---

## ✅ Email Client Compatibility Checklist

### Must Have
- ✅ Inline CSS (no <style> tags)
- ✅ Table-based layout
- ✅ Hex colors (not RGB)
- ✅ Web-safe fonts
- ✅ Alt text for images
- ✅ Proper DOCTYPE

### Should Avoid
- ❌ Background images
- ❌ CSS animations
- ❌ Hover effects
- ❌ Custom fonts
- ❌ Fixed positioning
- ❌ JavaScript

---

## 🧪 Quick Testing Checklist

```javascript
// Test both functions work:
console.log('Testing forgot username...');
await sendUsernameEmail('test@email.com', 'john_doe');

console.log('Testing forgot password...');
await sendPasswordResetEmail('test@email.com', 'token123abc456def', 'http://localhost:5000');
```

---

## 📞 Customization Support

### If You Need to:

**Change brand name**:
- Find: `StartInno Solutions`
- Replace with your brand name
- Update in: Hero section, footer

**Change support email**:
- Find: `support@startinnosolutions.com`
- Replace with your support email
- Update in: Footer links and text

**Change colors**:
- Find: Color hex codes
- Replace with your brand colors
- Refer to COLORS reference above

**Add company logo**:
- Create `<img>` element in hero section
- Use your logo URL
- Keep size reasonable (max-width: 200px)

**Add additional links**:
- Add `<a>` tags with proper styling
- Keep links colored with primary blue (#2563eb)
- Ensure links are accessible

---

## 🎯 Template Variables Reference

| Variable | Function | Example |
|----------|----------|---------|
| `email` | Recipient email | `user@example.com` |
| `username` | User's username | `john_doe` |
| `resetToken` | Password reset token | `64-char hex string` |
| `resetLink` | Full reset URL | `http://.../?token=...` |
| `baseUrl` | Frontend base URL | `http://localhost:5000` |

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Test in Gmail (web & mobile)
- [ ] Test in Outlook
- [ ] Test in Apple Mail
- [ ] Verify all links work
- [ ] Check mobile responsiveness
- [ ] Verify button styling
- [ ] Check text readability
- [ ] Ensure no broken HTML
- [ ] Verify security notices display
- [ ] Check footer visibility
- [ ] Test token functionality
- [ ] Verify brand consistency

---

## 📚 Related Files

- **Mailer Config**: `backend/config/mailer.js`
- **User Controller**: `backend/controllers/userController.js`
- **Forgot Username Page**: `frontend/user/forgot-username.html`
- **Forgot Password Page**: `frontend/user/forgot-password.html`
- **Reset Password Page**: `frontend/user/reset-password.html`

---

## 💡 Pro Tips

1. **Always test in real email clients** - Webmail previews can be misleading
2. **Use monospace font for usernames/tokens** - Improves readability
3. **Add backup links** - Not all clients support buttons
4. **Keep text contrast high** - Especially on dark backgrounds
5. **Use gradients sparingly** - Some clients render them differently
6. **Test with real data** - Use actual usernames and tokens
7. **Monitor spam scores** - Avoid spam trigger words
8. **Keep emails under 100KB** - Better delivery rates

---

## 🎓 Learning Resources

- [Email Client CSS Support](https://www.campaignmonitor.com/css/)
- [Email Best Practices](https://www.litmus.com/email-best-practices/)
- [Email HTML Standards](https://www.htmlemailboilerplate.com/)
- [Accessibility in Email](https://www.emailonacid.com/blog/article/accessibility)

---

**Last Updated**: May 10, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
