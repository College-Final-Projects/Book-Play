// Wait for the DOM to fully load before running the script
document.addEventListener("DOMContentLoaded", function () {
    // Get the login button
    const loginButton = document.getElementById("loginButton");

    // Add event listener to the login button
    loginButton.addEventListener("click", function () {
        // Redirect to the User Selection Page
        window.location.href = "../User_Selection_Page/user-selection.php";
    });
});
