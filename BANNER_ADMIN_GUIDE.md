# Admin Banner System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Access Admin Dashboard
1. Go to Admin Panel → Dashboard
2. You should see "Banner Setup" form
3. Below it, you'll see "Manage Banners" table

### Step 2: Upload Your First Banner

#### Required Fields
- **Banner Image** ⭐ (Required) - Upload a 1600x900px image or larger
- **Registration Link** - URL where users can register

#### Optional Fields
- **Banner Title** - Display name for the banner
- **Banner Link** - Where the banner image links to
- **WhatsApp Group Link** - Your WhatsApp group invite link
- **UPI ID** - For payment purposes
- **UPI Scanner Image** - QR code for UPI payment
- **Announcement Text** - Special message or offer
- **Active** - Check to make visible to users

### Step 3: Verify Banner Appears
1. Click "Create" button
2. Banner should appear in "Manage Banners" table within 2 seconds
3. See banner preview, title, links, and status

## 📋 Manage Banners Table

### Columns Explained
| Column | Description |
|--------|-------------|
| Preview | Thumbnail of your banner image |
| Title | Banner title you set |
| WhatsApp Link | WhatsApp group invite link |
| Registration Link | Registration URL |
| Status | Active (green) or Inactive (gray) |
| Created | Date banner was uploaded |
| Actions | Edit, Toggle Status, Delete buttons |

## ✏️ Edit Banner

### Steps
1. Find the banner in "Manage Banners" table
2. Click "Edit" button
3. Form will populate with current banner data
4. Make your changes
5. Click "Update Banner" button
6. Table will refresh with new data

### What You Can Edit
- ✅ Title
- ✅ Links (all of them)
- ✅ Banner image (replace with new one)
- ✅ UPI details
- ✅ Announcement
- ✅ Active status

## ⏸️ Toggle Active/Inactive

### Steps
1. Find the banner in "Manage Banners" table
2. Click "Disable" button (if Active) or "Enable" button (if Inactive)
3. Status will change immediately
4. Inactive banners are not shown to users

### Use Case
- Make banners inactive before deleting to hide from users
- Disable outdated banners without losing data

## 🗑️ Delete Banner

### Steps
1. Find the banner in "Manage Banners" table
2. Click "Delete" button
3. Confirmation dialog will appear
4. Click "OK" to confirm
5. Banner will be deleted permanently

### ⚠️ Important
- Deleted banners cannot be recovered
- Images are removed from Cloudinary
- Consider disabling before deleting

## 🖼️ Image Guidelines

### Recommended Specifications
- **Size**: 1600 x 900 pixels (16:9 aspect ratio)
- **Format**: JPG, PNG, WebP
- **Max File Size**: 5 MB
- **Quality**: High resolution for crisp display

### Tips
- Use professional design
- Include your event branding
- Make text readable
- Ensure good contrast
- Optimize for web

## 🔗 Link Guidelines

### WhatsApp Group Link
- Format: `https://chat.whatsapp.com/xxxxx`
- To get: Create WhatsApp group → Get invite link
- Users will join your WhatsApp group when clicking

### Registration Link
- Format: `https://yoursite.com/register` or similar
- Should point to your registration page
- Users navigate here to register for event

### Banner Link (Optional)
- Where the banner image clicks to
- Can be relative path `/register`
- Or full URL `https://yoursite.com/register`

## ⚙️ Activation System

### Active Status
- **Green "Active"** - Banner is visible to all users
- **Gray "Inactive"** - Banner is hidden from users

### Best Practices
1. Upload and test as Inactive first
2. Preview looks good before activating
3. Disable old banners when uploading new ones
4. One or few active banners at a time

## 🆘 Troubleshooting

### Issue: "Loading banners..." stays forever
**Solution**:
1. Press F12 to open DevTools
2. Go to Console tab
3. Run: `checkBannerSystem()`
4. Check output for specific errors

### Issue: Upload button doesn't work
**Solution**:
1. Refresh page
2. Check if image file is valid
3. Verify file size < 5MB
4. Try different image format

### Issue: Edit button doesn't work
**Solution**:
1. Ensure you have admin access
2. Check browser console (F12)
3. Try refreshing the page
4. Try another banner

### Issue: Banners uploaded but not appearing
**Solution**:
1. Check "Active" checkbox if not checked
2. Refresh the page
3. Check browser cache (Ctrl+Shift+R)
4. Run diagnostics: `checkBannerSystem()`

## 💡 Tips & Best Practices

### Optimal Workflow
1. Upload new banners as Inactive
2. Verify they appear in table
3. Activate when ready
4. Disable old banners
5. Delete after a few days

### Banner Content Tips
- Keep title concise (max 80 chars)
- Use clear, eye-catching images
- Include call-to-action text
- Add WhatsApp link for engagement
- Update regularly for fresh look

### Performance Tips
- Keep images optimized (< 1MB if possible)
- Delete unused banners
- Activate only needed banners
- Monitor loading time

## 📱 Mobile Viewing

### How Users See Banners
- Banners display on home page
- Responsive design for all devices
- Clickable links work on mobile
- WhatsApp links open WhatsApp app

### Testing on Mobile
1. Upload test banner
2. Activate it
3. Visit website on mobile phone
4. Verify banner appears and links work

## 🔐 Security Notes

### Your Token
- Never share your admin token
- Clear browser history after logout
- Don't leave admin panel open
- Re-login after computer restart

### Image Storage
- Images stored on Cloudinary
- Secure cloud storage
- Automatically optimized
- Backups maintained

## ❓ FAQ

**Q: How many banners can I have?**
A: Up to 8 banners. Upload more to replace old ones.

**Q: Can I upload the same image twice?**
A: Yes, but you can only have 8 total banners.

**Q: What happens when I delete a banner?**
A: It's removed permanently, including from Cloudinary.

**Q: Can inactive banners be seen?**
A: No, only active banners display to users.

**Q: How long do uploads take?**
A: Usually 1-3 seconds depending on image size.

**Q: Can I schedule banners?**
A: Currently no, but you can activate/deactivate manually.

**Q: What if upload fails?**
A: Check file size (< 5MB), format (JPG/PNG), and internet connection.

## 📞 Need Help?

### For Technical Issues
1. Open DevTools (F12)
2. Run: `checkBannerSystem()`
3. Check console for errors
4. Screenshot errors and send

### For Upload Issues
1. Check file format (must be image)
2. Check file size (must be < 5MB)
3. Verify internet connection
4. Try a different image

### For Display Issues
1. Refresh the page
2. Check if banner is Active
3. Check if browser cache (Ctrl+Shift+R)
4. Try another browser

---

**Last Updated**: May 9, 2026
**Version**: 1.0.0
