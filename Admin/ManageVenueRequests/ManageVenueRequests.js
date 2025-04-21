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
        <p><strong>Status:</strong> ${report.status}</p>
        <p><strong>Created:</strong> ${report.created_at}</p>
        <div class="actions">
          <button onclick="openModal(${index})">View Details</button>
          <button class="approve">Approve</button>
          <button class="reject">Reject</button>
        </div>
      `;

      card.querySelector(".approve").addEventListener("click", () => {
        handleAction(report.report_id, "accepted");
      });
      card.querySelector(".reject").addEventListener("click", () => {
        handleAction(report.report_id, "rejected");
      });

      venueContainer.appendChild(card);
    });
  }

  function handleAction(reportId, action) {
    fetch("UpdateReportStatus.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        report_id: reportId,
        status: action
      }),
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      location.reload();
    })
    .catch(err => {
      alert("❌ Failed to update report.");
      console.error(err);
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
});
