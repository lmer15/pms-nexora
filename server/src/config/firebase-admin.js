var admin = require('firebase-admin');
const { firebaseServiceAccount, FIREBASE_SERVICE_ACCOUNT, firebaseDatabaseURL } = require('./env');

// Use the service account from either source
const serviceAccount = firebaseServiceAccount || FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
  throw new Error('Firebase service account configuration is missing');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseDatabaseURL || `https://${serviceAccount.project_id}.asia-southeast1.firebasedatabase.app`
  });
}

// Initialize Firestore
const db = admin.firestore();
// Initialize Realtime Database
const realtimeDb = admin.database();

module.exports = { db, realtimeDb, admin };

