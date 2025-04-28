// ManageVenueRequests.js

// بعد جلب التقارير كما في السابق...
document.addEventListener("DOMContentLoaded", function () {
  const venueContainer = document.getElementById("venueContainer");
  const modal = document.getElementById("reportModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");

  let reportsData = [];

  fetch("Get_Reports.php")
    .then(res => res.json())
    .then(data => {
      reportsData = data;
      renderReports(data);
    })
    .catch(err => {
      venueContainer.innerHTML = "<p>❌ Failed to load reports.</p>";
      console.error(err);
    });

  function renderReports(reports) {
    venueContainer.innerHTML = "";

    reports.forEach((report, index) => {
      const card = document.createElement("div");
      card.className = "venue-card";
      card.innerHTML = `
        <h3>${report.suggested_place_name || "Unnamed Place"}</h3>
        <p><strong>Submitted by:</strong> ${report.username}</p>
        <p><strong>Created:</strong> ${report.created_at}</p>
        <div class="actions">
          <button onclick="openModal(${index})">View Details</button>
          <button class="approve" onclick="handleAction('approve', ${report.report_id}, ${report.facilities_id})">Approve</button>
          <button class="reject" onclick="handleAction('reject', ${report.report_id}, ${report.facilities_id})">Reject</button>
        </div>
      `;
      venueContainer.appendChild(card);
    });
  }

  window.openModal = function (index) {
    const report = reportsData[index];
    modalTitle.textContent = report.suggested_place_name || "Suggested Place";
    modalMessage.textContent = report.message;
    modal.style.display = "block";
  };

  window.closeModal = function () {
    modal.style.display = "none";
  };

  window.handleAction = function (action, reportId, facilitiesId) {
    fetch("HandleAction.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        action,
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
});