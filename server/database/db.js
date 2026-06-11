const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

let db = null;

async function init() {
  if (admin.getApps().length === 0) {
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account key file not found at ${serviceAccountPath}`);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });

    db = getFirestore();
    console.log('🔥 Connected to Firebase Firestore successfully!');
  }
  return db;
}

// Proxy to delegate database calls directly to Firestore db instance after init
const dbProxy = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'init') return init;
    if (!db) {
      throw new Error('Database not initialized. Call await db.init() first.');
    }
    const val = db[prop];
    if (typeof val === 'function') {
      return val.bind(db);
    }
    return val;
  }
});

module.exports = dbProxy;
