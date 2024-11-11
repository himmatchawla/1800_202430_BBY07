const express = require('express');
const router = express.Router();
const { db } = require('../firebase/firebaseAdmin');

// Route for viewing user history
router.get('/:userId/history', async (req, res) => {
  const { userId } = req.params;

  try {
    const historyRef = db.collection('users').doc(userId).collection('history');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').get();
    const history = snapshot.docs.map(doc => doc.data());

    res.render('history', { history });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
