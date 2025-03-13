console.log("JavaScript Loaded");
function redirectTo(page) {
    window.location.href = page;
}
document.getElementById("player").addEventListener("click", function () {
    sessionStorage.setItem("selectedUser", "player");
    window.location.href = "../Home Page/player/PlayerProfile.html";
});


    document.getElementById("facilityOwner").addEventListener("click", function () {
        window.location.href = "../Home Page/Facility_Owner/FacilityDashboard.html";

    });

