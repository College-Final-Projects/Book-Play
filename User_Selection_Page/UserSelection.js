console.log("JavaScript Loaded");
function redirectTo(page) {
    window.location.href = page;
}
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("player").addEventListener("click", function () {
        window.location.href = "../Home Page/player/PlayerDashboard.html"; 

    });

    document.getElementById("facilityOwner").addEventListener("click", function () {
        window.location.href = "../Home Page/Facility_Owner/FacilityDashboard.php";

    });
});
