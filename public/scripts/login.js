const firebaseConfig = {
    apiKey: "AIzaSyDr1vA3wOtKq01WABZTtnjKeUOn-Yc17ko",
    authDomain: "transitaura.firebaseapp.com",
    projectId: "transitaura",
    storageBucket: "transitaura.firebasestorage.app",
    messagingSenderId: "522264051253",
    appId: "1:522264051253:web:e4ec773e80453c7b52bb7c",
    measurementId: "G-FD02KS68HH"
  };

// prevent double firebase instance init (very bad)
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  }
  
  // FirebaseUI config for auth
  const uiConfig = {
      signInSuccessUrl: 'main.html', // Redirect to main.html on successful login
      signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
      tosUrl: '/terms', // Terms of service URL
      privacyPolicyUrl: '/privacy' // Privacy policy URL
  };
  
  // Initialize FirebaseUI for Firebase auth
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  
  // Start FirebaseUI auth interface
  ui.start('#firebaseui-auth-container', uiConfig);
  
  // Listen for Firebase authentication state changes
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is signed in, get the ID token
      user.getIdToken().then(idToken => {
        // Send the ID token to the server to verify and create a session
        fetch('/verifyToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ idToken })
        })
        .then(response => {
          if (!response.ok) throw new Error("Failed to verify token on server");
          return response.json();
        })
        .then(data => {
          console.log('Token verified and session created:', data);
          // Optionally, redirect to main.html or update the UI
          window.location.href = "main.html";
        })
        .catch(error => {
          console.error('Error verifying token:', error);
        });
      });
    } else {
      console.log("User is not signed in");
    }
  });
  

  function logout() {
    fetch("/logout", { method: "POST" })
      .then(response => {
        if (!response.ok) throw new Error("Logout failed");
        return response.json();
      })
      .then(data => {
        console.log(data.message); // "Logout successful"
        window.location.href = "/"; // Redirect to home or login page
      })
      .catch(error => {
        console.error("Error logging out:", error);
      });
  }
  