// FIREBASECONFIG.JS INITIALIZES FIREBASE AND FIRESTORE

// initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDr1vA3wOtKq01WABZTtnjKeUOn-Yc17ko",
    authDomain: "transitaura.firebaseapp.com",
    projectId: "transitaura",
    storageBucket: "transitaura.firebasestorage.app",
    messagingSenderId: "522264051253",
    appId: "1:522264051253:web:e4ec773e80453c7b52bb7c",
    measurementId: "G-FD02KS68HH"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized");
  }
  
  const db = firebase.firestore(); // Initialize Firestore
