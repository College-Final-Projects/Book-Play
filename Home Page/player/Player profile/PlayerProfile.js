document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("playerProfileForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent actual form submission

        // Get form values
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const age = document.getElementById("age").value;
        const gender = document.getElementById("gender").value;
        const favoriteSports = Array.from(document.getElementById("favoriteSport").selectedOptions).map(opt => opt.value);
        const description = document.getElementById("description").value;

        // Store data in sessionStorage
        sessionStorage.setItem("playerProfile", JSON.stringify({
            firstName,
            lastName,
            age,
            gender,
            favoriteSports,
            description
        }));

        alert("Profile saved successfully!");

        // Redirect to Player Dashboard inside Home Page Folder
        window.location.href = "../../Home Page/player/BookVenue.html";
    });
});
