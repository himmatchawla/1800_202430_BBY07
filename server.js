// setup
const express = require('express');
const session = require('express-session');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase/serviceAccountKey.json')
const path = require('path');
const { auth, db } = require('./firebase/firebaseAdmin.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON request bodies
app.use(express.json());

// Setup session management
app.use(session({
  secret: process.env.SESSION_SECRET, // Replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));








// Middleware to check auth
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}








app.post('/verifyToken', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    req.session.user = uid;

    // Check if user document exists in Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create a new document with default values
      await userRef.set({
        auraPoints: 0,
        history: []
      });
      console.log(`User document created for UID: ${uid}`);
    }

    res.json({ message: 'Token verified', uid });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
});




app.get('/checkSession', (req, res) => {
  if (req.session.user) {
    res.json({ message: 'Session is active', userId: req.session.user });
  } else {
    res.status(401).json({ message: 'No active session' });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.status(200).json({ message: "Logout successful" });
  });
});










// Dynamic station route
app.get('/station/:stationId', async (req, res) => {
  const { stationId } = req.params;

  try {
      console.log(`Fetching data for station with ID: ${stationId}`);

      const stationDoc = await db.collection('stations').doc(stationId).get();

      if (!stationDoc.exists) {
          console.error(`Station with ID ${stationId} not found in Firestore.`);
          return res.status(404).send('Station not found');
      }

      const stationData = stationDoc.data();
      console.log(`Station data retrieved:`, stationData);

      res.render('station', { station: stationData, stationId });
  } catch (error) {
      console.error('Error fetching station data:', error); // Detailed error log
      res.status(500).send('Internal Server Error');
  }
});

// report safety level route
app.post('/station/:stationId/report-safety', async (req, res) => {
  const { stationId } = req.params;
  const { safetyLevel } = req.body;
  const userId = req.session.user;

  if (!userId) {
    return res.status(401).json({ message: "User is not authenticated." });
  }

  try {
    // Reference to the subcollection for safety reports
    const safetyReportRef = db.collection('stations').doc(stationId).collection('safetyReports').doc();

    // Add a new safety report
    await safetyReportRef.set({
      userId,
      safetyLevel: parseInt(safetyLevel),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Retrieve safety reports from the last hour
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 3600000);
    const recentReportsQuery = db.collection('stations').doc(stationId)
      .collection('safetyReports')
      .where('timestamp', '>', oneHourAgo);

    const recentReportsSnapshot = await recentReportsQuery.get();
    const recentReports = recentReportsSnapshot.docs.map(doc => doc.data().safetyLevel);

    // Calculate the average safety level
    const averageSafetyLevel = recentReports.reduce((sum, level) => sum + level, 0) / recentReports.length;

    // Update the station's currentSafetyLevel
    await db.collection('stations').doc(stationId).update({
      currentSafetyLevel: averageSafetyLevel
    });

    res.json({ message: "Safety level reported successfully!" });
  } catch (error) {
    console.error("Error reporting safety level:", error);
    res.status(500).json({ message: "Failed to report safety level" });
  }
});




// Protected route
app.get('/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'You are authorized to access this route.' });
});







// Serve static files for public folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));