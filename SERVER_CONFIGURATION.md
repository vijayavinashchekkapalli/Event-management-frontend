# Express Server Configuration Reference

## Complete Express Server Setup for Event Management System

This document shows the complete Express server configuration that fixes all routing issues.

---

## Key Configuration Points

### 1. Static File Serving
```javascript
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const frontendPath = path.join(__dirname, "../frontend");

// Proper static file serving from frontend directory
app.use(express.static(frontendPath, {
  maxAge: '1h',
  etag: false,
  index: false  // We handle index manually
}));
```

**Why this works:**
- `path.join(__dirname, "../frontend")` creates proper absolute path
- `maxAge: '1h'` caches files for performance
- `index: false` prevents trying to serve index.html automatically
- Allows fallback route to handle unknown paths

### 2. API Routes (Before Frontend Routes)
```javascript
app.use("/api/auth", authLimiter, require("./routes/userRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/register", require("./routes/teamRoutes"));
app.use("/api/issues", require("./routes/issueRoutes"));
app.use("/api/banner", require("./routes/bannerRoutes"));
app.use("/api/admin/banner", require("./routes/adminBannerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
```

**Important:** API routes MUST come before frontend routes to avoid conflicts.

### 3. Explicit Frontend Routes
```javascript
// Root route - redirect to user login
app.get("/", (req, res) => {
  res.redirect("/user/login.html");
});

// Admin routes - WITH AND WITHOUT .html
app.get("/admin/login.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/login.html"));
});
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/login.html"));
});

app.get("/admin/dashboard.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/dashboard.html"));
});
app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/dashboard.html"));
});

app.get("/admin/issues.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/issues.html"));
});
app.get("/admin/issues", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/issues.html"));
});

app.get("/admin/edit.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit.html"));
});
app.get("/admin/edit", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/edit.html"));
});

app.get("/admin/student.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/student.html"));
});
app.get("/admin/student", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin/student.html"));
});

// User routes - WITH AND WITHOUT .html
app.get("/user/login.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/login.html"));
});
app.get("/user/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/login.html"));
});

app.get("/user/register.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/register.html"));
});
app.get("/user/register", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/register.html"));
});

app.get("/user/dashboard.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/dashboard.html"));
});
app.get("/user/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/dashboard.html"));
});

app.get("/user/help.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/help.html"));
});
app.get("/user/help", (req, res) => {
  res.sendFile(path.join(frontendPath, "user/help.html"));
});
```

**Why this approach:**
- Supports both `.html` and non-`.html` URLs
- Explicit routing is more reliable than regex patterns
- Easy to add new routes
- Clear error tracking

### 4. Fallback Route (SPA Support)
```javascript
// Fallback route - handles all other requests
app.get('*', (req, res) => {
  const requestedPath = path.join(frontendPath, req.path);
  
  // Check if the requested path exists as a file
  fs.stat(requestedPath, (err) => {
    if (err) {
      // File doesn't exist, serve index.html for client-side routing
      res.sendFile(path.join(frontendPath, "index.html"), (sendErr) => {
        if (sendErr) {
          console.error('[Fallback] Error sending index.html:', sendErr);
          res.status(404).json({ error: 'Not Found' });
        }
      });
    } else {
      // File exists, send it
      res.sendFile(requestedPath);
    }
  });
});
```

**Why this works:**
- Checks if file physically exists first
- Only falls back to index.html if file doesn't exist
- Prevents 404 errors for valid static files
- Supports SPA-style client-side routing
- Proper error handling

### 5. Error Middleware (After All Routes)
```javascript
app.use(notFound);      // 404 handler
app.use(errorHandler);  // Error handler
```

**IMPORTANT:** Error middleware MUST come last, after all other middleware and routes.

---

## Route Execution Order (CRITICAL)

```
1. CORS Middleware
   ↓
2. Body Parsing & Compression Middleware
   ↓
3. Rate Limiting
   ↓
4. Logging Middleware
   ↓
5. Static File Server (for CSS, JS, images)
   ↓
6. API Routes (/api/*)  ← BEFORE frontend routes
   ↓
7. Explicit Frontend Routes (/admin/*, /user/*)
   ↓
8. Fallback Route (*)   ← Catches everything else
   ↓
9. Error Handlers
```

**If order is wrong:**
- API routes might be blocked by frontend routes
- Fallback route might catch API requests
- 404 errors won't be handled correctly

---

## Frontend Navigation - Required Changes

### HTML Navigation Links
```html
<!-- BEFORE (BROKEN) -->
<a href="dashboard.html">Dashboard</a>

<!-- AFTER (WORKING) -->
<a href="/admin/dashboard.html">Dashboard</a>
```

### JavaScript Redirects
```javascript
// BEFORE (BROKEN)
window.location.href = "dashboard.html";

// AFTER (WORKING)
window.location.href = "/admin/dashboard.html";
```

### Button Redirects
```html
<!-- BEFORE (BROKEN) -->
<button onclick="window.location.href='login.html'">Login</button>

<!-- AFTER (WORKING) -->
<button onclick="window.location.href='/admin/login.html'">Login</button>
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Hardcoded paths without leading slash
```javascript
// This will break when navigated from deep URLs
window.location.href = "dashboard.html";  // DON'T DO THIS
```

### ✅ CORRECT: Absolute paths with leading slash
```javascript
// This works from anywhere
window.location.href = "/admin/dashboard.html";  // DO THIS
```

### ❌ WRONG: Frontend routes before static middleware
```javascript
app.use(express.static(path));
app.get('*', (req, res) => { /* fallback */ });  // WRONG ORDER
```

### ✅ CORRECT: Static middleware before fallback
```javascript
app.use(express.static(path));           // Static files first
app.get('/admin/*', ...);                // Explicit routes
app.get('*', (req, res) => { /* ... */ }); // Fallback last
```

### ❌ WRONG: Using relative paths in fetch calls
```javascript
// If user is at /admin/dashboard, this tries /admin/api/issues
fetch("api/issues")  // DON'T DO THIS
```

### ✅ CORRECT: Using absolute paths in fetch
```javascript
// Works from anywhere
fetch("http://localhost:5000/api/issues")  // DO THIS
// Or use relative to domain
fetch("/api/issues")  // Also OK
```

---

## Testing Routes

### Test with cURL or browser:
```bash
# Test root
curl http://localhost:5000/

# Test admin pages with .html
curl http://localhost:5000/admin/login.html
curl http://localhost:5000/admin/dashboard.html

# Test admin pages without .html
curl http://localhost:5000/admin/login
curl http://localhost:5000/admin/dashboard

# Test user pages
curl http://localhost:5000/user/login
curl http://localhost:5000/user/register

# Test API
curl http://localhost:5000/api/admin/banner

# Test static files
curl http://localhost:5000/admin/styles.css
curl http://localhost:5000/js/admin.js
```

---

## Server Configuration Checklist

- ✅ Static file serving configured with options
- ✅ API routes registered before frontend routes
- ✅ Explicit routes for all HTML pages
- ✅ Both `.html` and non-`.html` URLs supported
- ✅ Root path has explicit handler
- ✅ Fallback route handles unknown paths
- ✅ Error middleware at the end
- ✅ Frontend links use absolute paths
- ✅ JavaScript redirects use absolute paths
- ✅ All paths use `path.join()` for cross-platform compatibility

---

## Deployment Considerations

### For Render / Vercel / Heroku:
```javascript
// Use environment port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### For production build:
```javascript
// Serve minified frontend
app.use(compression());

// Set cache headers for production
app.use(express.static(frontendPath, {
  maxAge: '1d',  // Increase from 1h to 1d in production
  etag: true     // Enable ETags for caching
}));
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot GET /admin/login | Route not registered | Add explicit route handler |
| Static files 404 | Static middleware misconfigured | Check path.join() and order |
| API routes not working | Frontend routes blocking them | Move API routes before frontend |
| Page refresh loses login | Frontend issue, not routing | Check localStorage/session |
| Links break with navigation | Relative paths used | Use absolute paths with `/` prefix |

---

**Version:** 1.0  
**Last Updated:** May 9, 2026  
**Status:** Production Ready
