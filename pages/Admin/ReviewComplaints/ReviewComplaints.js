document.addEventListener("DOMContentLoaded", function () {
  loadPlaceReports();
});

// Store the current complaint data
let currentComplaint = null;

function loadPlaceReports() {
  console.log("🔄 Loading place reports...");
  fetch("ReviewComplaintsController.php?action=get_place_reports")
    .then(res => {
      console.log("📡 Response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("📊 Received data:", data);
      console.log("📊 Data length:", data.length);
      
      const table = document.getElementById("complaintsTable");
      table.innerHTML = "";

      if (data.length === 0) {
        console.log("📭 No complaints found");
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">No complaints found</td>`;
        table.appendChild(emptyRow);
        return;
      }

      console.log("📋 Rendering", data.length, "complaints");
      data.forEach((report, index) => {
        console.log(`📋 Report ${index + 1}:`, report);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${report.username}</td>
          <td>${report.facilities_id || 'N/A'}</td>
          <td>${report.owner_username || 'Unknown'}</td>
          <td>${report.Reason || 'No reason provided'}</td>
          <td>
            <button class="btn btn-view" onclick="openVenue(${report.facilities_id})">View Venue</button>
            <button class="btn btn-view" style="margin-left: 5px" onclick="showComplaintDetails(${JSON.stringify(report).replace(/"/g, '&quot;')})">Details</button>
          </td>
        `;
        table.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Failed to load place reports:", err);
      const table = document.getElementById("complaintsTable");
      table.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Failed to load reports. Please try again.</td></tr>`;
    });
}

function openVenue(id) {
  if (!id) {
    alert("Venue ID not available");
    return;
  }
  window.location.href = `../../player/VenueDetails/VenueDetails.php?facilities_id=${id}&view_only=true`;
}

function showComplaintDetails(report) {
  currentComplaint = report;
  
  let message = `
    <strong>Reported by:</strong> ${report.username}<br>
    <strong>Venue Owner:</strong> ${report.owner_username || 'Unknown'}<br>
    <strong>Reason:</strong> ${report.Reason || 'No reason provided'}<br>
    <strong>Venue ID:</strong> ${report.facilities_id || 'N/A'}<br>
    <strong>Date:</strong> ${new Date(report.created_at).toLocaleString()}<br>
    <strong>Message:</strong><br>${report.message || 'No additional message'}
  `;
  
  openModal(message);
}

function openModal(message) {
  document.getElementById("modalMessage").innerHTML = message;
  document.getElementById("complaintModal").style.display = "flex";
}

function resolve() {
  if (!currentComplaint) {
    alert("No complaint selected");
    return;
  }
  
  const formData = new FormData();
  formData.append('action', 'mark_resolved');
  formData.append('id', currentComplaint.report_id);
  
  fetch("ReviewComplaintsController.php", {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ Complaint marked as resolved");
        document.getElementById("complaintModal").style.display = "none";
        loadPlaceReports(); // Reload the table
      } else {
        alert("❌ Error: " + (data.message || "Failed to mark as resolved"));
      }
    })
    .catch(err => {
      console.error("❌ Failed to resolve complaint:", err);
      alert("Failed to mark complaint as resolved");
    });
}


window.onclick = function(event) {
  const modal = document.getElementById("complaintModal");
  if (event.target === modal) modal.style.display = "none";
};