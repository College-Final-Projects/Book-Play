// Global variables
let facilities = [];
let currentSearch = '';
let currentSort = 'name';
let currentSport = 'all';
let currentVenue = '';
let currentMonth = 'January';
let venueAnalyticsData = {};

function loadFacilities() {
  fetch('fetch_venues.php?action=get_facilities')
    .then(response => response.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('Invalid data:', data);
        return;
      }
      facilities = data;
      applyFilters();
    })
    .catch(error => {
      console.error('Error loading facilities:', error);
      const venueGrid = document.getElementById('venueCards');
      if (venueGrid) {
        venueGrid.innerHTML = '<div class="no-venues-message">Failed to load venues.</div>';
      }
    });
}

function displayVenues(data) {
  const grid = document.getElementById('venueCards');
  grid.innerHTML = '';

  if (data.length === 0) {
    grid.innerHTML = '<div class="no-venues-message">No venues match your filters.</div>';
    return;
  }

  data.forEach(facility => {
    const card = document.createElement('div');
    card.className = 'venue-card';
    card.innerHTML = `
      <img src="${facility.image_url || 'default.jpg'}" class="venue-image" />
      <div class="venue-name">${facility.place_name}</div>
      <div class="venue-sport"> ${facility.SportCategory}</div>
      <div class="venue-rating">📍 ${facility.location || 'Unknown location'}</div>
      <button class="view-button" onclick="openBookings('${facility.place_name}')">View Analytics</button>
    `;
    grid.appendChild(card);
  });
}

function applyFilters() {
  let result = facilities;
  if (currentSearch.trim()) {
    result = result.filter(f => f.place_name.toLowerCase().startsWith(currentSearch.toLowerCase()));
  }
  if (currentSport !== 'all') {
    result = result.filter(f => f.SportCategory.toLowerCase() === currentSport.toLowerCase());
  }
  if (currentSort === 'name') {
    result.sort((a, b) => a.place_name.localeCompare(b.place_name));
  } else if (currentSort === 'name-desc') {
    result.sort((a, b) => b.place_name.localeCompare(a.place_name));
  }
  displayVenues(result);
}

window.onload = () => {
  loadFacilities();
  loadSports();
  document.getElementById('searchInput').addEventListener('input', e => {
    currentSearch = e.target.value;
    applyFilters();
  });
  document.getElementById('sortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    applyFilters();
  });
  document.getElementById('sportSelect').addEventListener('change', e => {
    currentSport = e.target.value;
    applyFilters();
  });
};

function loadSports() {
  fetch('fetch_sports.php')
    .then(response => response.json())
    .then(data => {
      const sportSelect = document.getElementById('sportSelect');
      data.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.toLowerCase();
        option.textContent = sport;
        sportSelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error loading sports:', error));
}

function openBookings(venueName) {
  const year = document.getElementById("yearSelect").value;
  currentVenue = venueName;
  currentMonth = 'January';
  document.getElementById("venueTitle").textContent = `Bookings for ${venueName}`;
  document.getElementById("bookingPage").style.display = "flex";
  document.getElementById("cardSection").style.display = "none";
  fetchMonthlyData(venueName, year);
}

function fetchMonthlyData(venueName, year) {
  const url = `fetch_monthly_analytics.php?venue=${encodeURIComponent(venueName)}&year=${year}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      venueAnalyticsData = data;
      populateMonthButtons(Object.keys(data));
      showMonth("January");
    })
    .catch(err => {
      console.error("❌ Error fetching monthly data:", err);
    });
}

function populateMonthButtons(months) {
  document.querySelectorAll('.month-btn').forEach(btn => {
    if (btn.textContent !== 'All') {
      btn.style.display = months.includes(btn.textContent) ? 'block' : 'none';
    }
  });
}

function showMonth(month) {
  currentMonth = month;
  const tableBody = document.getElementById("dailyBookingTable");
  const summaryRow = document.getElementById("summaryRow");
  tableBody.innerHTML = '';

  if (month === 'All') {
    let monthTotals = {};

    Object.entries(venueAnalyticsData).forEach(([monthName, entries]) => {
      let monthlyBookings = 0;
      let monthlyRevenue = 0;
      entries.forEach(entry => {
        monthlyBookings += entry.bookings;
        monthlyRevenue += entry.total;
      });
      monthTotals[monthName] = {
        bookings: monthlyBookings,
        total: monthlyRevenue
      };
    });

    Object.entries(monthTotals).forEach(([monthName, summary]) => {
      tableBody.innerHTML += `
        <tr>
          <td>${monthName}</td>
          <td>${summary.bookings}</td>
          <td>${summary.total.toFixed(2)} ₪</td>
        </tr>`;
    });

    const totalBookings = Object.values(monthTotals).reduce((sum, m) => sum + m.bookings, 0);
    const totalRevenue = Object.values(monthTotals).reduce((sum, m) => sum + m.total, 0);

    summaryRow.innerHTML = `
      <span>Total Bookings: ${totalBookings}</span>
      <span>Total Revenue: ₪${totalRevenue.toFixed(2)}</span>
    `;
  } else {
    const data = venueAnalyticsData[month] || [];
    let totalBookings = 0;
    let totalRevenue = 0;

    data.forEach(entry => {
      tableBody.innerHTML += `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.bookings}</td>
          <td>${entry.total} ₪</td>
        </tr>`;
      totalBookings += entry.bookings;
      totalRevenue += entry.total;
    });

    summaryRow.innerHTML = `
      <span>Total Bookings: ${totalBookings}</span>
      <span>Total Revenue: ₪${totalRevenue.toFixed(2)}</span>
    `;
  }

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

window.openBookings = openBookings;
