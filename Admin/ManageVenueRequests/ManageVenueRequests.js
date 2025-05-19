// ManageVenueRequests.js

document.addEventListener("DOMContentLoaded", function () {
  const venueContainer = document.getElementById("venueContainer");
  const modal = document.getElementById("reportModal");
  
  // Use the consolidated API endpoint with the 'get_reports' action
  fetch("VenueAPI.php?action=get_reports")
    .then(res => res.json())
    .then(data => {
      renderReports(data);
    })
    .catch(err => {
      venueContainer.innerHTML = "<p>❌ Failed to load reports.</p>";
      console.error(err);
    });

  function renderReports(reports) {
    venueContainer.innerHTML = "";

    if (reports.length === 0) {
      venueContainer.innerHTML = "<p>No venue requests found.</p>";
      return;
    }

    reports.forEach((report, index) => {
      const card = document.createElement("div");
      card.className = "venue-card";
      card.innerHTML = `
        <h3>${report.suggested_place_name || "Unnamed Place"}</h3>
        <p><strong>Submitted by:</strong> ${report.username}</p>
        <p><strong>Created:</strong> ${report.created_at}</p>
        <div class="actions">
          <button onclick="openVenue(${report.facilities_id})">View Details</button>
          <button class="approve" onclick="handleAction('approve', ${report.report_id}, ${report.facilities_id})">Approve</button>
          <button class="reject" onclick="handleAction('reject', ${report.report_id}, ${report.facilities_id})">Reject</button>
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