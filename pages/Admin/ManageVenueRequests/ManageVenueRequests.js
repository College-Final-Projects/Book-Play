// ManageVenueRequests.js

document.addEventListener("DOMContentLoaded", function () {
  const venueContainer = document.getElementById("venueContainer");
  const modal = document.getElementById("reportModal");
  
  console.log("🔄 Loading venue requests and unaccepted venues...");
  
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
      
      renderReports(data);
    })
    .catch(err => {
      console.error("❌ Error loading reports:", err);
      venueContainer.innerHTML = `<p>❌ Failed to load reports: ${err.message}</p>`;
    });

  function renderReports(reports) {
    venueContainer.innerHTML = "";

    if (reports.length === 0) {
      venueContainer.innerHTML = "<p>No venue requests or unaccepted venues found.</p>";
      return;
    }

    console.log("📋 Rendering", reports.length, "items");
    
    reports.forEach((item, index) => {
      console.log(`📋 Item ${index + 1}:`, item);
      
      const card = document.createElement("div");
      card.className = "venue-card";
      
      // Determine if this is a report or venue
      const isReport = item.source_type === 'report';
      const placeName = item.place_name || "Unnamed Place";
      const submittedBy = item.username || "Unknown";
      const createdAt = item.created_at || "Unknown date";
      const reportId = item.report_id || null;
      const facilitiesId = item.facilities_id;
      
      card.innerHTML = `
        <h3>${placeName}</h3>
        <p><strong>Type:</strong> ${isReport ? 'Venue Suggestion' : 'Unaccepted Venue'}</p>
        <p><strong>Submitted by:</strong> ${submittedBy}</p>
        <p><strong>Created:</strong> ${createdAt}</p>
        ${item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
        ${item.price ? `<p><strong>Price:</strong> ₪${item.price}</p>` : ''}
        <div class="actions">
          <button class="btn-view" onclick="openVenue(${facilitiesId})">View Details</button>
          ${isReport && reportId ? `
            <button class="btn-approve" onclick="handleAction('approve', ${reportId}, ${facilitiesId})">Approve</button>
            <button class="btn-reject" onclick="handleAction('reject', ${reportId}, ${facilitiesId})">Reject</button>
          ` : `
            <button class="btn-approve" onclick="handleAction('approve', null, ${facilitiesId})">Approve</button>
            <button class="btn-reject" onclick="handleAction('reject', null, ${facilitiesId})">Reject</button>
          `}
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
    window.location.href = `../VenueDetails/VenueDetails.php?id=${id}`;
  };

  window.closeModal = function () {
    modal.style.display = "none";
  };

  window.handleAction = function (subaction, reportId, facilitiesId) {
    // Updated to use the consolidated API with action=handle_action
    fetch("VenueAPI.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        action: "handle_action",
        subaction: subaction,
        report_id: reportId,
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

  // Add a function to update report status (previously in UpdateReportStatus.php)
  window.updateReportStatus = function(reportId, status) {
    fetch("VenueAPI.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        action: "update_status",
        report_id: reportId,
        status: status
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