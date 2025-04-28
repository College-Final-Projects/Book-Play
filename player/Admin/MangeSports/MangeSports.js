document.addEventListener("DOMContentLoaded", function () {
  loadAcceptedSports(); // تحميل الرياضات المقبولة

  // 🔹 تحميل الرياضات المقبولة
  function loadAcceptedSports() {
    fetch("MangeSportsController.php?action=get_accepted_sports")
      .then(res => res.json())
      .then(data => {
        const tableBody = document.getElementById("currentSportsTableBody");
        tableBody.innerHTML = "";

        data.forEach((sport, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${sport.sport_name}</td>
            <td><button class="btn delete" data-sport-id="${sport.sport_id}" onclick="deleteSport(${sport.sport_id})">Delete</button></td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load accepted sports:", err);
      });
  }

  // 🔹 عرض/إخفاء أقسام
  window.toggleSection = function (id) {
    document.getElementById(id).classList.toggle("hidden");
  };

  // 🔹 تحميل الرياضات المقترحة
  window.loadSuggestedSports = function () {
    fetch("MangeSportsController.php?action=get_suggested_sports")
      .then(res => res.json())
      .then(data => {
        const table = document.getElementById("suggestedSportsTableBody");
        table.innerHTML = "";
        data.forEach((report, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${report.suggested_sport_name}</td>
            <td>
              <button class="btn accept" onclick="handleAction('accept', ${report.report_id}, '${report.suggested_sport_name}')">Accept</button>
              <button class="btn delete" onclick="handleAction('reject', ${report.report_id})">Reject</button>
            </td>
          `;
          table.appendChild(row);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load suggested sports:", err);
      });
  };

  // 🔹 تنفيذ إجراء القبول/الرفض
  window.handleAction = function (action, reportId, sportName = null) {
    const bodyData = new URLSearchParams({ action, report_id: reportId });
    if (sportName) bodyData.append("sport_name", sportName);

    fetch("MangeSportsController.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyData
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          loadSuggestedSports();
          loadAcceptedSports();
        }
      })
      .catch(err => {
        console.error("❌ Failed to handle action:", err);
      });
  };

  // 🔹 إضافة رياضة جديدة
  document.getElementById("addSportBtn").addEventListener("click", () => {
    const name = document.getElementById("newSportName").value.trim();
    if (!name) return alert("Please enter sport name");

    fetch("MangeSportsController.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "add_sport", name })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          loadSuggestedSports();
          loadAcceptedSports();
        }
      })
      .catch(err => {
        console.error("❌ Failed to add sport:", err);
      });
  });
  window.deleteSport = function (sportId) {
    const button = document.querySelector(`button[data-sport-id="${sportId}"]`);
    const row = button.closest("tr");
  
    if (!confirm("Are you sure you want to delete this sport?")) return;
  
    button.disabled = true;
    button.textContent = "Deleting...";
  
    fetch("MangeSportsController.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "delete_sport", sport_id: sportId })
    })
      .then(res => res.json())
      .then(data => {
        showMessage(data.message, data.success);
  
        if (data.success) {
          row.remove();
          setTimeout(() => {
            loadAcceptedSports();
          }, 1000);
        } else {
          button.disabled = false;
          button.textContent = "Delete";
        }
      })
      .catch(err => {
        console.error("❌ Failed to delete sport:", err);
        showMessage("Something went wrong while deleting!", false);
        button.disabled = false;
        button.textContent = "Delete";
      });
  };
  
  function showMessage(message, isSuccess = true) {
    const msgBox = document.getElementById("sportMessage");
    msgBox.textContent = message;
    msgBox.className = "message-box " + (isSuccess ? "message-success" : "message-error");
    msgBox.style.display = "block";
  
    // إخفاء الرسالة بعد 4 ثواني تلقائيًا
    setTimeout(() => {
      msgBox.style.display = "none";
    }, 4000);
  }  
});
