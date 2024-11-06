// firebaseAPI.js
const admin = require('firebase-admin');

// Replace with the path to your Firebase service account JSON key file
const serviceAccount = require('./transitaura-firebase-adminsdk-5hovz-fc100ee8db.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;
