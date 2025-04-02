console.log("JavaScript Loaded");
function redirectTo(page) {
    window.location.href = page;
}
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("player").addEventListener("click", function () {
        window.location.href = "../Navbar/Navbar.php"; 

    });

    document.getElementById("facilityOwner").addEventListener("click", function () {
        window.location.href = "../Navbar/Navbar.php";

    });
});
