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
    databaseURL: firebaseDatabaseURL || `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

// Initialize Firestore
const db = admin.firestore();

// Test Firestore connection
db.collection('test').doc('test').get().then(() => {
  console.log('Firestore connection successful');
}).catch((error) => {
  console.error('Firestore connection failed:', error.message);
  if (error.code === 5) {
    console.error('Firestore database not found. Please ensure Firestore is enabled in Firebase console for project:', serviceAccount.project_id);
  }
});

module.exports = { db, admin };

