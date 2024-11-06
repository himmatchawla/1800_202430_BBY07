// const express = require('express');
// const db = require('./scripts/firebaseAPIadminside.js');
// const path = require('path');

// const app = express();
// const port = 3000;

// // Set up the view engine (using EJS as an example)
// app.set('view engine', 'ejs');

// // Serve static files from the 'public' directory (optional)
// app.use(express.static(path.join(__dirname, 'public')));

// // Route to fetch a station page dynamically
// app.get('/:stationName', async (req, res) => {
//   const stationName = req.params.stationName; // Get the station name from the URL

//   try {
//     // Fetch the station data from Firestore
//     const stationRef = db.collection('stations').doc(stationName);
//     const doc = await stationRef.get();

//     if (!doc.exists) {
//       // If no such station exists, return a 404 page
//       return res.status(404).send('Station not found');
//     }

//     const stationData = doc.data();
//     // Render an HTML page dynamically with the station data
//     res.render('station', {
//       stationName,
//       stationData,
//     });

//   } catch (error) {
//     console.error('Error fetching station data:', error);
//     res.status(500).send('Server error');
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });


console.log('Starting server...');  

const express = require('express'); 
const db = require('./scripts/firebaseAPIadminside.js');
const path = require('path');

const app = express();
const port = 3000;

console.log('Before setting view engine...'); 

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/:stationName', async (req, res) => {
  const stationName = req.params.stationName;
  console.log(`Fetching data for station: ${stationName}`);
  
  try {
    const stationRef = db.collection('stations').doc(stationName);
    const doc = await stationRef.get();

    if (!doc.exists) {
      console.log(`Station ${stationName} not found in Firestore.`);
      return res.status(404).send('Station not found');
    }

    const stationData = doc.data();
    console.log(`Station data fetched: `, stationData);

    res.render('station', {
      stationName,
      stationData,
    });

  } catch (error) {
    console.error('Error fetching station data:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

