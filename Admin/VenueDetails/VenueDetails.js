document.addEventListener("DOMContentLoaded", function () {
  // Get the venue ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get("id");

  if (venueId) {
    loadVenueDetails(venueId);
  } else {
    showError("No venue ID provided.");
  }
});

function loadVenueDetails(venueId) {
  fetch(`VenueDetailsController.php?action=get_venue_details&id=${venueId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showError(data.error);
        return;
      }

      displayVenueDetails(data);
    })
    .catch((error) => {
      console.error("Error loading venue details:", error);
      showError("Failed to load venue details. Please try again.");
    });
}

function displayVenueDetails(venue) {
  // Update the venue card with facility details
  document.getElementById(
    "placeName"
  ).innerHTML = `<strong>Place Name:</strong> ${venue.place_name || "N/A"}`;
  document.getElementById("location").innerHTML = `<strong>Location:</strong> ${
    venue.location || "N/A"
  }`;
  document.getElementById(
    "description"
  ).innerHTML = `<strong>Description:</strong> ${venue.description || "N/A"}`;
  document.getElementById(
    "sportCategory"
  ).innerHTML = `<strong>Sport Category:</strong> ${
    venue.SportCategory || "N/A"
  }`;
  document.getElementById(
    "ownerUsername"
  ).innerHTML = `<strong>Owner Username:</strong> ${
    venue.owner_username || "N/A"
  }`;

  // For email, we don't have it directly in the facilities table, but you could fetch it from users table if needed
  document.getElementById(
    "ownerEmail"
  ).innerHTML = `<strong>Owner Email:</strong> ${venue.owner_email || "N/A"}`;

  // Update the image if available
  const imagePreview = document.getElementById("imagePreview");
  if (venue.image_url && venue.image_url.trim() !== "") {
    imagePreview.src = venue.image_url;
    imagePreview.style.display = "block";
  } else {
    imagePreview.src = "../../assets/images/no-image.jpg"; // Default image
    imagePreview.style.display = "block";
  }

  // Show the venue card
  document.getElementById("venueCard").style.display = "block";
}

function showError(message) {
  const venueCard = document.getElementById("venueCard");
  venueCard.innerHTML = `
        <h2>Error</h2>
        <div class="info error-message">${message}</div>
        <div class="back-wrapper" style="margin-top: 20px;">
            <button class="btn-back" onclick="history.back()">← Back</button>
        </div>
    `;
  venueCard.style.display = "block";
}
