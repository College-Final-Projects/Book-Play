// ManageVenueRequests.js

document.addEventListener("DOMContentLoaded", function () {
  const venueContainer = document.getElementById("venueContainer");
  const modal = document.getElementById("reportModal");
  
  console.log("🔄 Loading unaccepted facilities...");
  
  // Use the consolidated API endpoint with the 'get_reports' action
  fetch("VenueAPI.php?action=get_reports")
    .then(res => {
      console.log("📡 Response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("📊 Received data:", data);
      console.log("📊 Data length:", data.length);
      
      // Check if data is an error response
      if (data.success === false) {
        console.error("❌ API returned error:", data.message);
        venueContainer.innerHTML = `<p>❌ Error: ${data.message}</p>`;
        return;
      }
      
      renderFacilities(data);
    })
    .catch(err => {
      console.error("❌ Error loading facilities:", err);
      venueContainer.innerHTML = `<p>❌ Failed to load facilities: ${err.message}</p>`;
    });

  function renderFacilities(facilities) {
    venueContainer.innerHTML = "";

    if (facilities.length === 0) {
      venueContainer.innerHTML = "<p>No unaccepted facilities found.</p>";
      return;
    }

    console.log("📋 Rendering", facilities.length, "facilities");
    
    facilities.forEach((facility, index) => {
      console.log(`📋 Facility ${index + 1}:`, facility);
      
      const card = document.createElement("div");
      card.className = "venue-card";
      
      const placeName = facility.place_name || "Unnamed Place";
      const submittedBy = facility.username || "Unknown";
      const createdAt = facility.created_at || "Unknown date";
      const facilitiesId = facility.facilities_id;
      const sportCategory = facility.SportCategory || "Unknown Sport";
      const description = facility.description || "No description available";
      
      card.innerHTML = `
        <h3>${placeName}</h3>
        <p><strong>Owner:</strong> ${submittedBy}</p>
        <p><strong>Sport:</strong> ${sportCategory}</p>
        <p><strong>Created:</strong> ${createdAt}</p>
        ${facility.location ? `<p><strong>Location:</strong> ${facility.location}</p>` : ''}
        ${facility.price ? `<p><strong>Price:</strong> ₪${facility.price}</p>` : ''}
        <p><strong>Description:</strong> ${description}</p>
        <div class="actions">
          <button class="btn-view" onclick="openVenue(${facilitiesId})">View Details</button>
          <button class="btn-approve" onclick="handleAction('approve', ${facilitiesId})">Approve</button>
          <button class="btn-reject" onclick="handleAction('reject', ${facilitiesId})">Reject</button>
        </div>
      `;
      venueContainer.appendChild(card);
    });
  }

  window.openVenue = function(id) {
    if (!id) {
      alert("Venue ID not available");
      return;
    }
    window.location.href = `../../player/VenueDetails/VenueDetails.php?facilities_id=${id}&admin_only=true`;
  };

  window.closeModal = function () {
    modal.style.display = "none";
  };

  window.handleAction = function (subaction, facilitiesId) {
    // Updated to use the consolidated API with action=handle_action
    fetch("VenueAPI.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        action: "handle_action",
        subaction: subaction,
        facilities_id: facilitiesId
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          location.reload();
        }
      })
      .catch(err => {
        alert("❌ Something went wrong");
        console.error(err);
      });
  };
});