document.addEventListener("DOMContentLoaded", function () {
loadPlaceReports();
});
function loadPlaceReports() {
  fetch("MangeSportsController.php?action=get_place_reports")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("complaintsTable");
      table.innerHTML = "";

      data.forEach((report) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${report.username}</td>
          <td>${report.facilities_id}</td>
          <td>${report.Reason}</td>
          <td><button>click here</button></td>
        `;
        table.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Failed to load place reports:", err);
    });
}

function openVenue(id) {
  window.location.href = `../VenueDetails/VenueDetails.php?id=${id}`;
}

function openModal(message) {
  document.getElementById("modalMessage").innerText = message;
  document.getElementById("complaintModal").style.display = "flex";
}

function resolve() {
  alert("✔ Complaint marked as resolved");
  document.getElementById("complaintModal").style.display = "none";
}

function removeVenue() {
  alert("⚠ Venue has been removed");
  document.getElementById("complaintModal").style.display = "none";
}

window.onclick = function(event) {
  const modal = document.getElementById("complaintModal");
  if (event.target === modal) modal.style.display = "none";
};

