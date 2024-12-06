// SKELETON.JS DISPLAYS NAV_BEFORE_LOGIN AND NAV_AFTER_LOGIN

function loadSkeleton() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in
            console.log($('#navbarPlaceholder').load('../text/nav_after_login.html'));
            console.log($('#footerPlaceholder').load('../text/footer.html'));
        } else {
            // No user is signed in
            console.log($('#navbarPlaceholder').load('../text/nav_before_login.html'));
            console.log($('#footerPlaceholder').load('../text/footer.html'));
        }
    });
}
loadSkeleton(); // call