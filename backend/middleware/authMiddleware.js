const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { cacheGet, cacheSet } = require('../config/redis');

function extractBearerToken(req) {
  const header = String(req.headers.authorization || '').trim();
  if (!header) return null;

  const [scheme, token] = header.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

function tokenCacheKey(token, suffix) {
  const tokenHash = crypto.createHash('sha1').update(token).digest('hex');
  return `auth:${suffix}:${tokenHash}`;
}

function shouldLogAuth() {
  return process.env.AUTH_DEBUG === 'true' || (process.env.NODE_ENV || 'development') === 'development';
}

async function verifyToken(req, res, next) {
  if (process.env.NODE_ENV !== 'production' && req.originalUrl && req.originalUrl.startsWith('/api/register')) {
    req.user = { uid: 'dev-user' };
    return next();
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    req.originalUrl &&
    req.originalUrl.startsWith('/api/teams/register')
  ) {
    req.user = { uid: 'dev-user' };
    return next();
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    req.originalUrl &&
    req.originalUrl.startsWith('/api/issues') &&
    req.method === 'POST' &&
    !req.headers.authorization
  ) {
    req.user = { uid: 'dev-user' };
    return next();
  }

  const token = extractBearerToken(req);
  if (shouldLogAuth()) {
    console.log('[authMiddleware] extracted token present:', Boolean(token));
  }

  if (!token) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  try {
    const decodedFirebase = await admin.auth().verifyIdToken(token);
    req.user = decodedFirebase;
    return next();
  } catch (firebaseError) {
    if (shouldLogAuth()) {
      console.log('[authMiddleware] firebase verification failed, trying JWT');
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const cachedUser = await cacheGet(tokenCacheKey(token, 'user'));
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const user = await User.findById(decoded.id).select('+isAdmin +uid +email +phone');
    if (!user) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    req.user = {
      id: user._id,
      uid: user.uid,
      email: user.email,
      phone_number: user.phone,
      admin: !!user.isAdmin
    };

    cacheSet(tokenCacheKey(token, 'user'), req.user, Number(process.env.AUTH_USER_CACHE_TTL_SECONDS || 300)).catch((cacheError) => {
      if (shouldLogAuth()) {
        console.warn('[authMiddleware] user cache write failed:', cacheError.message);
      }
    });

    if (shouldLogAuth()) {
      console.log('[authMiddleware] request user normalized:', {
        id: String(req.user.id || ''),
        email: req.user.email || '',
        admin: req.user.admin
      });
    }

    return next();
  } catch (err) {
    console.error('[authMiddleware] token verification failed:', err.message);
    return res.status(401).json({ msg: err.name === 'TokenExpiredError' ? 'Authentication expired' : 'Invalid token' });
  }
}

async function protectAdmin(req, res, next) {
  const token = extractBearerToken(req);
  if (shouldLogAuth()) {
    console.log('[protectAdmin] token present:', Boolean(token));
  }

  if (!token) {
    return res.status(401).json({ success: false, msg: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    if (decoded.admin) {
      const cachedAdmin = await cacheGet(tokenCacheKey(token, 'admin'));
      if (cachedAdmin) {
        req.admin = cachedAdmin.admin;
        req.user = cachedAdmin.user;
        return next();
      }
    }

    const adminUser = await User.findById(decoded.id).select('+isAdmin +email +phone');

    if (!adminUser || !adminUser.isAdmin) {
      console.warn('[protectAdmin] admin lookup failed or user is not admin');
      return res.status(403).json({ success: false, msg: 'Admin only' });
    }

    req.admin = {
      id: adminUser._id.toString(),
      email: adminUser.email,
      admin: true
    };

    req.user = {
      id: adminUser._id,
      email: adminUser.email,
      admin: true
    };

    cacheSet(tokenCacheKey(token, 'admin'), {
      admin: req.admin,
      user: req.user
    }, Number(process.env.AUTH_USER_CACHE_TTL_SECONDS || 300)).catch((cacheError) => {
      if (shouldLogAuth()) {
        console.warn('[protectAdmin] admin cache write failed:', cacheError.message);
      }
    });

    if (shouldLogAuth()) {
      console.log('[protectAdmin] admin authenticated:', req.admin);
    }
    return next();
  } catch (err) {
    console.error('[protectAdmin] token verification failed:', err.message);
    return res.status(err.name === 'TokenExpiredError' ? 401 : 401).json({
      success: false,
      msg: err.name === 'TokenExpiredError' ? 'Authentication expired' : 'Invalid token'
    });
  }
}

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.protectAdmin = protectAdmin;