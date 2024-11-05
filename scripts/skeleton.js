function loadSkeleton() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in
            console.log("User is signed in");
            $('#navbarPlaceholder').load('../text/nav_after_login.html');

            // Redirect to main page if user is on '/' or '/login.html'
            if (window.location.pathname === '/' || window.location.pathname === '/login.html') {
                window.location.href = '/main.html';
            }
        } else {
            // No user is signed in
            console.log("No user is signed in");
            $('#navbarPlaceholder').load('../text/nav_before_login.html');

            // Redirect to '/' if user is not on '/' or '/login.html'
            if (!(window.location.pathname === '/' || window.location.pathname === '/login.html'
                || window.location.pathname === "/aboutus.html" || window.location.pathname === "/help.html")) {
                window.location.href = '/';
            }
        }
    });
}
loadSkeleton(); // Call the function to initiate the process
