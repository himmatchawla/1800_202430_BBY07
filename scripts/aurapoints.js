function calculateTitle(auraPoints) {
    const titles = [
        { points: 500, title: "Giga Chad" },
        { points: 200, title: "Chad" },
        { points: 100, title: "Giga Sigma" },
        { points: 80, title: "Sigma" },
        { points: 65, title: "Giga Alpha" },
        { points: 50, title: "Alpha" },
        { points: 35, title: "Giga Beta" },
        { points: 25, title: "Beta" },
        { points: 10, title: "Giga Ligma" },
        { points: 5, title: "Ligma" },
    ];

    for (const level of titles) {
        if (auraPoints >= level.points) {
            return level.title;
        }
    }
    return "No Aura"; 
}

function createAchievementCard(title, points, progress) {
    return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">Points Required: ${points}</p>
                <div class="progress">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </div>
    `;
}

function populateAuraPoints() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUser = db.collection("users").doc(user.uid);
            currentUser.get()
                .then(userDoc => {
                    if (userDoc.exists) {
                        const auraPoints = userDoc.data().auraPoints || 0;
                        const userTitle = calculateTitle(auraPoints);

                        // Update the points and title in the HTML
                        document.getElementById("userAuraPoints").innerText = `Points: ${auraPoints}`;
                        document.getElementById("titleDisplay").innerText = `Your Title: ${userTitle}`;

                        // Create achievements in ascending order
                        const titles = [
                            { points: 5, title: "Ligma" },
                            { points: 10, title: "Giga Ligma" },
                            { points: 25, title: "Beta" },
                            { points: 35, title: "Giga Beta" },
                            { points: 50, title: "Alpha" },
                            { points: 65, title: "Giga Alpha" },
                            { points: 80, title: "Sigma" },
                            { points: 100, title: "Giga Sigma" },
                            { points: 200, title: "Chad" },
                            { points: 500, title: "Giga Chad" }
                        ];

                        let achievementsHTML = "";
                        titles.forEach(level => {
                            const progress = Math.min((auraPoints / level.points) * 100, 100).toFixed(2);
                            achievementsHTML += createAchievementCard(level.title, level.points, progress);
                        });

                        document.getElementById("achievementsContainer").innerHTML = achievementsHTML;
                    } else {
                        console.log("No user document found");
                    }
                })
                .catch(error => {
                    console.error("Error getting user document:", error);
                });
        } else {
            console.log("No user is signed in");
        }
    });
}

populateAuraPoints();
