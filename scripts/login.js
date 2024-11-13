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

// script run tester
console.log("Login script loaded");

// new firebase instance if one doesnt already exist
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized")
} else {
  console.log("Firebase already initialized")
}

// set db const as firestore db
const db = firebase.firestore();

// configure FirebaseUI for authentication
const uiConfig = {
  signInSuccessUrl: 'main.html', // Redirect to this page on successful login
  signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  tosUrl: '/terms',
  privacyPolicyUrl: '/privacy'
};
const ui = new firebaseui.auth.AuthUI(firebase.auth());
console.log("FirebaseUI initialized"); // debug logging
ui.start('#firebaseui-auth-container', uiConfig);
console.log("FirebaseUI started"); // debug logging

// login with Firebase Auth
async function login(email, password) {
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    console.log("User logged in");
    checkUserDocument();
  } catch (error) {
    console.error("Login failed:", error);
  }
}

// logout
async function logout() {
  await firebase.auth().signOut();
  console.log("User logged out");
}

// create unique user document (in collection "users") when authenticated
async function checkUserDocument() {
  const user = firebase.auth().currentUser;
  if (user) {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        auraPoints: 0,
        history: []
      });
      console.log("User document created:", user.uid);
    }
  }
}

// listen for auth state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("User is logged in:", user);
    checkUserDocument();
  } else {
    console.log("User is logged out");
  }
});
