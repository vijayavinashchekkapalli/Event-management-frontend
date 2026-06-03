const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.disable('x-powered-by');
let activeServer = null;

app.set('trust proxy', 1);

const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = nodeEnv === 'development';
const isTesting = nodeEnv === 'testing';

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
].filter((origin, index, list) => list.indexOf(origin) === index);

const corsOptions = {
  origin(origin, callback) {
    // During local development allow all origins to avoid CORS mismatches
    if (isDev) return callback(null, true);
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter: in development/testing skip limiter to avoid blocking load tests or local requests
let authLimiter;
if (isDev || isTesting) {
  // no-op middleware during local development
  authLimiter = (req, res, next) => next();
} else {
  const authLimitDefault = 10;
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX || authLimitDefault),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth requests, please try again later.' }
  });
}

app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(isTesting ? (req, res, next) => next() : generalLimiter);

const serverTimingThresholdMs = Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 500);
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const logPayload = `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;

    if (durationMs >= serverTimingThresholdMs) {
      console.warn(`[SLOW REQUEST] ${logPayload}`);
    } else {
      console.log(logPayload);
    }
  });

  next();
});

connectDB();
connectRedis().catch((error) => {
  console.warn('Redis unavailable, continuing without cache:', error.message);
});

// Serve static frontend files
const staticRoot = path.join(__dirname, '../frontend');
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }

    if (/[.](css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
};

app.use(express.static(staticRoot, staticOptions));
app.use('/frontend', express.static(staticRoot, staticOptions));

app.use('/api/auth', authLimiter, require('./routes/userRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/register', require('./routes/teamRoutes'));
app.use('/api/payments', require('./routes/PaymentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/banner', require('./routes/bannerRoutes'));
app.use('/api/admin/banner', require('./routes/adminBannerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Backend API is working',
    timestamp: new Date().toISOString()
  });
});

// Test DELETE endpoint (for debugging)
app.delete('/api/test/delete/:id', (req, res) => {
  res.json({ 
    success: true,
    message: 'DELETE method is working',
    testId: req.params.id
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime()
  });
});

app.get('/api/health/ready', async (req, res) => {
  const mongoose = require('mongoose');
  const { getRedisClient } = require('./config/redis');

  res.json({
    status: mongoose.connection.readyState === 1 ? 'ready' : 'degraded',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: getRedisClient() ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (req, res) => {
  res.json({
    status: 'alive',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.redirect('/user/index.html');
});

app.get('/user', (req, res) => {
  res.redirect('/user/index.html');
});

app.get('/user/login', (req, res) => {
  res.redirect('/user/login.html');
});

app.get('/user/signup', (req, res) => {
  res.redirect('/user/signup.html');
});

app.get('/user/forgot-password', (req, res) => {
  res.redirect('/user/forgot-password.html');
});

app.get('/user/forgot-username', (req, res) => {
  res.redirect('/user/forgot-username.html');
});

app.get('/user/reset-password', (req, res) => {
  res.redirect('/user/reset-password.html');
});

app.get('/user/dashboard', (req, res) => {
  res.redirect('/user/dashboard.html');
});

app.get('/user/help', (req, res) => {
  res.redirect('/user/help.html');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/user/dashboard.html');
});

app.get('/help', (req, res) => {
  res.redirect('/user/help.html');
});

app.get('/track-registration', (req, res) => {
  res.redirect('/user/dashboard.html?tab=registration-details');
});

app.get('/admin', (req, res) => {
  res.redirect('/user/admin-login.html');
});

app.get('/admin/login', (req, res) => {
  res.redirect('/user/admin-login.html');
});

app.get('/admin/login.html', (req, res) => {
  res.redirect('/user/admin-login.html');
});

app.get('/admin/dashboard', (req, res) => {
  res.redirect('/admin/dashboard.html');
});

app.get('/admin/issues', (req, res) => {
  res.redirect('/admin/issues.html');
});

app.get('/admin/edit', (req, res) => {
  res.redirect('/admin/edit.html');
});

app.use(notFound);
app.use(errorHandler);

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 8;

function startServer(port = DEFAULT_PORT, retriesLeft = MAX_PORT_RETRIES) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  activeServer = server;

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use.`);
      if (process.env.NODE_ENV !== 'production' && retriesLeft > 0) {
        const nextPort = port + 1;
        console.log(`Attempting to start on port ${nextPort} (retries left: ${retriesLeft - 1})`);
        setTimeout(() => startServer(nextPort, retriesLeft - 1), 500);
        return;
      }
      console.error('Unable to bind to port and no retries left. Exiting.');
      process.exit(1);
    }
    console.error('Server encountered an error:', err);
    process.exit(1);
  });
}

startServer();

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught exception:', error);
  process.exit(1);
});

function shutdown() {
  if (!activeServer) {
    process.exit(0);
    return;
  }

  console.log('[Process] Graceful shutdown requested');
  activeServer.close(() => {
    console.log('[Process] HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);