// 🌐 Global state variables
let facilities = [];
let currentSearch = '';
let currentSort = 'name';
let currentSport = 'all';
let currentVenue = '';
let currentMonth = 'All';
let venueAnalyticsData = {};

// 📥 Load all venues from AnalyticsAPI
function loadFacilities() {
  console.log('🔍 Loading facilities from AnalyticsAPI...');
  
  fetch('AnalyticsAPI.php?action=fetch_venues')
    .then(response => {
      console.log('📡 API Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('📊 API Response data:', data);
      
      if (!data.success) {
        console.error('❌ API returned error:', data.message);
        const venueGrid = document.getElementById('venueCards');
        if (venueGrid) {
          venueGrid.innerHTML = `<div class="no-venues-message">API Error: ${data.message}</div>`;
        }
        return;
      }
      
      if (!Array.isArray(data.venues)) {
        console.error('❌ Invalid data format:', data);
        return;
      }
      
      console.log(`✅ Loaded ${data.venues.length} venues`);
      facilities = data.venues;
      applyFilters();
    })
    .catch(error => {
      console.error('❌ Error loading facilities:', error);
      const venueGrid = document.getElementById('venueCards');
      if (venueGrid) {
        venueGrid.innerHTML = '<div class="no-venues-message">Failed to load venues. Please check console for details.</div>';
      }
    });
}

// 🖼️ Display venue cards in the UI
function displayVenues(data) {
  const grid = document.getElementById('venueCards');
  grid.innerHTML = '';

  if (data.length === 0) {
    grid.innerHTML = '<div class="no-venues-message">No venues match your filters.</div>';
    return;
  }



  data.forEach(facility => {
    // Handle image path - check if it's already a full path or just filename
    let imagePath;
    if (facility.image_url && facility.image_url !== 'null' && facility.image_url.trim() !== '') {
      if (facility.image_url.startsWith('http') || facility.image_url.startsWith('/')) {
        // Full URL or absolute path
        imagePath = facility.image_url;
      } else {
        // Just filename, construct full path
        imagePath = `../../../uploads/venues/${facility.image_url}`;
      }
    } else {
      // No image or null, use default
      imagePath = '../../../uploads/venues/default.jpg';
    }

    const card = document.createElement('div');
    card.className = 'venue-card';
    
    card.innerHTML = `
      <img src="${imagePath}" class="venue-image" alt="${facility.place_name}" onerror="this.src='../../../uploads/venues/default.jpg'" />
      <div class="venue-name">${facility.place_name}</div>
      <div class="venue-sport">${facility.SportCategory}</div>
      <div class="venue-rating">📍 ${facility.location || 'Unknown location'}</div>
      <button class="view-button" onclick="openBookings('${facility.place_name}')">View Analytics</button>
    `;
    
    grid.appendChild(card);
  });
}

// 🧠 Apply filters and sorting on venue data
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

// 🚀 Initialize on page load
window.onload = () => {
  loadFacilities();
  loadSports();
  populateYearSelector();

  // 🔎 Handle user input and filters
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
  
  // Handle year selection change
  document.getElementById('yearSelect').addEventListener('change', e => {
    if (currentVenue) {
      // If we're viewing analytics for a venue, refresh the data for the new year
      fetchMonthlyData(currentVenue, e.target.value);
    }
  });
};

// 🎯 Load all sports categories from API
function loadSports() {
  fetch('AnalyticsAPI.php?action=fetch_sports')
    .then(response => response.json())
    .then(data => {
      const sportSelect = document.getElementById('sportSelect');
      data.sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sport_name.toLowerCase();
        option.textContent = sport.sport_name;
        sportSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading sports:', error);
    });
}

// 📅 Populate year selector with last 3 years
function populateYearSelector() {
  const yearSelect = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();
  
  // Clear existing options
  yearSelect.innerHTML = '';
  
  // Add last 3 years (current year and 2 previous years)
  for (let i = 0; i < 3; i++) {
    const year = currentYear - i;
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    
    // Set current year as default selected
    if (i === 0) {
      option.selected = true;
    }
    
    yearSelect.appendChild(option);
  }
}

// 📊 Open analytics view for a selected venue
function openBookings(venueName) {
  const year = document.getElementById("yearSelect").value;
  currentVenue = venueName;
  currentMonth = 'January';

  document.getElementById("venueTitle").textContent = `Bookings for ${venueName}`;
  document.getElementById("bookingPage").style.display = "flex";
  document.getElementById("cardSection").style.display = "none";
  
  // Hide the search bar when showing detailed analytics
  document.querySelector(".search-sort-container").style.display = "none";

  fetchMonthlyData(venueName, year);
}

// 📅 Fetch monthly analytics from API
function fetchMonthlyData(venueName, year) {
  const url = `AnalyticsAPI.php?action=fetch_monthly_analytics&venue=${encodeURIComponent(venueName)}&year=${year}`;
  console.log('🔍 Fetching analytics for:', venueName, 'Year:', year);
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log('📊 Analytics data received:', data);
      venueAnalyticsData = data.data || {};
      populateMonthButtons(Object.keys(venueAnalyticsData));
      showMonth("All");
    })
    .catch(err => {
      console.error("❌ Error fetching monthly data:", err);
    });
}

// 📆 Show only month buttons that have data
function populateMonthButtons(months) {
  document.querySelectorAll('.month-btn').forEach(btn => {
    const monthName = btn.textContent;
    if (monthName === 'All' || venueAnalyticsData[monthName]) {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  });
}

// 📈 Show table data for selected month
function showMonth(month) {
  currentMonth = month;
  const tableBody = document.getElementById("dailyBookingTable");
  const summaryRow = document.getElementById("summaryRow");
  tableBody.innerHTML = '';

  console.log(`📅 Showing data for month: ${month}`);
  console.log('📊 Available data:', venueAnalyticsData);

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

    console.log('📈 Month totals:', monthTotals);

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

    console.log(`📅 Data for ${month}:`, data);

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: #666; font-style: italic;">
            No booking data available for ${month}
          </td>
        </tr>`;
    } else {
      data.forEach(entry => {
        tableBody.innerHTML += `
          <tr>
            <td>${entry.date}</td>
            <td>${entry.bookings}</td>
            <td>${entry.total.toFixed(2)} ₪</td>
          </tr>`;
        totalBookings += entry.bookings;
        totalRevenue += entry.total;
      });
    }

    summaryRow.innerHTML = `
      <span>Total Bookings: ${totalBookings}</span>
      <span>Total Revenue: ₪${totalRevenue.toFixed(2)}</span>
    `;
  }

  // Highlight selected month button
  document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.month-btn')).find(b => b.textContent === month);
  if (activeBtn) activeBtn.classList.add('active');
}

// ⬅️ Back to venue cards view
function goBack() {
  document.getElementById("bookingPage").style.display = "none";
  document.getElementById("cardSection").style.display = "block";
  
  // Show the search bar again when going back to main page
  document.querySelector(".search-sort-container").style.display = "flex";
}

// 🧾 Export bookings data to PDF
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

// Expose function to global scope
window.openBookings = openBookings;
