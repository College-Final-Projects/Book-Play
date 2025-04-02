const navLinks = document.getElementById("navLinks");

const buttonsByRole = {
  Player: ["Book a Venue", "Join a Group", "Find a Player", "Favorites", "My Friends"],
  FacilityOwner: ["Add Facilities", "View Bookings", "Reviews"]
};

let userType = localStorage.getItem("userType") || "Player";

function loadNavbarButtons() {
  const buttons = buttonsByRole[userType] || [];
  navLinks.innerHTML = "";

  buttons.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;

    li.addEventListener("click", () => {
      if (text === "Book a Venue") {
        window.location.href = "../User_Selection_Page/player/BookVenue/BookVenue.html";
      } else if (text === "Join a Group") {
        window.location.href = "join-group.html";
      } else if (text === "Find a Player") {
        window.location.href = "find-player.html";
      } else if (text === "Favorites") {
        window.location.href = "favorites.html";
      } else if (text === "My Friends") {
        window.location.href = "my-friends.html";
      }
    });

    navLinks.appendChild(li);
  });
}

loadNavbarButtons();
