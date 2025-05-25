let currentMonth = 'January';
let venueAnalyticsData = {};
let currentVenue = '';

window.onload = () => {
  console.log("✅ Analytics.js loaded");
  fetchVenues();
};

function fetchVenues() {
  fetch("get_facilities.php")
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById("venueCards");
      grid.innerHTML = '';

      data.forEach(venue => {
        const card = document.createElement("div");
        card.className = "venue-card";
        card.innerHTML = `
          <img src="${venue.image}" class="venue-image" />
          <div class="venue-name">${venue.name}</div>
          <div class="venue-rating"><span class="star">📅 ${venue.bookings} bookings</span></div>
          <button class="view-button" onclick="openBookings('${venue.name}')">View Analytics</button>
        `;
        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error fetching venues:", err);
    });
}

function openBookings(venueName) {
  console.log("🧠 openBookings CALLED with:", venueName);
  const selectedYear = document.getElementById("yearSelect").value;
  const url = `fetch_analytics.php?venue=${encodeURIComponent(venueName)}&year=${selectedYear}`;

  console.log("🎯 Sending request to:", url);

  currentVenue = venueName;
  document.getElementById("cardSection").style.display = "none";
  document.getElementById("bookingPage").style.display = "flex";
  document.getElementById("venueTitle").textContent = "Bookings for " + venueName;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("📊 Received data:", data);
      venueAnalyticsData = data;
      showMonth("January");
    })
    .catch(err => {
      console.error("❌ Fetch error:", err);
    });
}
window.openBookings = openBookings;

function showMonth(month) {
  currentMonth = month;
  let table = document.getElementById("bookingTable");
  let summary = document.getElementById("summaryRow");
  table.innerHTML = '';
  let data = venueAnalyticsData[month] || [];
  let totalBookings = 0, totalMoney = 0;

  data.forEach(entry => {
    table.innerHTML += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.bookings}</td>
        <td>${entry.total}₪</td>
      </tr>
    `;
    totalBookings += entry.bookings;
    totalMoney += entry.total;
  });

  summary.innerHTML = `
    <span>Total Bookings: ${totalBookings}</span>
    <span>Total Revenue: ₪${totalMoney}</span>
  `;

  document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.month-btn')).find(b => b.textContent === month);
  if (activeBtn) activeBtn.classList.add('active');
}

function goBack() {
  document.getElementById("bookingPage").style.display = "none";
  document.getElementById("cardSection").style.display = "block";
}

function downloadPDF() {
  const element = document.getElementById("pdfContent");
  const opt = {
    margin: 0.5,
    filename: 'bookings-report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
