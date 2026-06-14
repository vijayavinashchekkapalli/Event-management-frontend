let cachedAdmin = null;
let initializationError = null;

function getFirebaseAdmin() {
  if (cachedAdmin) {
    return cachedAdmin;
  }

  if (initializationError) {
    return null;
  }

  try {
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || undefined
      });
    }

    cachedAdmin = admin;
    return cachedAdmin;
  } catch (error) {
    initializationError = error;
    console.warn('[firebase] Firebase admin unavailable, continuing without Firebase auth:', error.message);
    return null;
  }
}

module.exports = {
  getFirebaseAdmin
};