//LOGIN.JS HANDLES FIREBASE LOGIN AND LOGOUT, CREATING USER DOCUMENTS AFTER REGISTRATION, AND DISPLAYING THE USER'S NAME ON MAIN.HTML

// error logging
console.log("Login script loaded");

const auth = firebase.auth();

// configure FirebaseUI for authentication
const uiConfig = {
  signInSuccessUrl: 'main.html',
  signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  tosUrl: '/terms',
  privacyPolicyUrl: '/privacy'
};
const ui = new firebaseui.auth.AuthUI(firebase.auth());
console.log("FirebaseUI initialized"); // error logging
ui.start('#firebaseui-auth-container', uiConfig); // firebase UI package init
console.log("FirebaseUI started"); // error logging

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
        name: user.displayName,
        email: user.email,
        auraPoints: 0,
        history: []
      });
      console.log("User document created:", user.uid);
    }
  }
}

// listen for auth state changes - is user logged in?
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("User is logged in:", user);
    checkUserDocument();
  } else {
    console.log("User is logged out");
  }
});

// display name on main.html
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User detected:", user); // error logging
    if (user.displayName) {
      document.getElementById('nameGoesHere').textContent = user.displayName;
    } else {
      document.getElementById('nameGoesHere').textContent = "User";
      console.log("Display name not set for this user.");
    }
  } else {
    console.log("No user logged in."); // error logging
  }
});