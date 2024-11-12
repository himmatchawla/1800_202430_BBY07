const express = require('express');
const router = express.Router();
const { db } = require('../firebase/firebaseAdmin');

// Route for reporting safety level
router.post('/:stationId/report-safety', async (req, res) => {
  const { stationId } = req.params;
  const { safetyLevel } = req.body;
  const userId = req.session.user;

  try {
    const safetyReportRef = db.collection('stations').doc(stationId).collection('safetyReports').doc();
    await safetyReportRef.set({
      userId,
      safetyLevel: parseInt(safetyLevel),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      auraPoints: admin.firestore.FieldValue.increment(1),
      'history': admin.firestore.FieldValue.arrayUnion({
        stationId,
        type: 'safety',
        safetyLevel: parseInt(safetyLevel),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    res.redirect(`/station/${stationId}`);
  } catch (error) {
    console.error('Error reporting safety level:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for reporting incidents
router.post('/:stationId/report-incident', async (req, res) => {
  const { stationId } = req.params;
  const { title, description } = req.body;
  const userId = req.session.user;

  try {
    const incidentRef = db.collection('stations').doc(stationId).collection('incidentReports').doc();
    await incidentRef.set({
      userId,
      title,
      description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      auraPoints: admin.firestore.FieldValue.increment(3),
      'history': admin.firestore.FieldValue.arrayUnion({
        stationId,
        type: 'incident',
        title,
        description,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    res.redirect(`/station/${stationId}`);
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
