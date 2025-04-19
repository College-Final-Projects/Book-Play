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
