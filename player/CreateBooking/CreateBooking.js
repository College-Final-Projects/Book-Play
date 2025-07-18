let isPublic = true;
let startTimePicker, endTimePicker, startDatePicker;

document.addEventListener('DOMContentLoaded', function() {
  initializeDateTimePickers();
  setupEventListeners();
  setDefaultValues();
  updateSummary();
});

function initializeDateTimePickers() {
  startDatePicker = flatpickr("#startDate", {
    minDate: "today",
    dateFormat: "Y-m-d",
    onChange: updateSummary
  });

  startTimePicker = flatpickr("#startTime", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 30,
    onChange: () => {
      updateEndTimeMinTime();
      updateSummary();
    }
  });

  endTimePicker = flatpickr("#endTime", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 30,
    onChange: updateSummary
  });
}

function setupEventListeners() {
  document.getElementById('playerCount').addEventListener('input', updateSummary);
  document.getElementById('bookingForm').addEventListener('submit', handleFormSubmission);
}

const facilityId = new URLSearchParams(window.location.search).get("facility_id");

if (facilityId) {
  fetch(`CreateBookingAPI.php?facility_id=${facilityId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const facility = data.facility;

        // تعبئة معلومات البطاقة
        document.querySelector(".venue-image img").src = facility.image_url || "images/default.jpg";
        document.querySelector(".venue-title").textContent = facility.place_name;
        document.querySelector(".venue-location").textContent = `📍 ${facility.location}`;
        document.querySelector(".venue-price").innerHTML = `₪${facility.price} <span class="per">per hour</span>`;

        // تلخيص السعر والاسم
        document.getElementById("summaryVenue").textContent = facility.place_name;
        document.getElementById("summaryRate").textContent = `₪${facility.price}/hour`;
      } else {
        console.warn("Facility not found.");
      }
    })
    .catch(err => console.error("Failed to fetch facility", err));
}


function toggleGroupType() {
  const btn = document.getElementById('groupTypeBtn');
  const icon = document.getElementById('groupTypeIcon');
  const text = document.getElementById('groupTypeText');
  const passwordInput = document.getElementById('groupPassword');

  isPublic = !isPublic;

  if (isPublic) {
    btn.classList.remove('private');
    icon.textContent = '🌐';
    text.textContent = 'Public Group';
    passwordInput.style.display = 'none';
  } else {
    btn.classList.add('private');
    icon.textContent = '🔒';
    text.textContent = 'Private Group';
    passwordInput.style.display = 'block';
  }
  updateSummary();
}

function updateEndTimeMinTime() {
  const startTime = document.getElementById('startTime').value;
  if (startTime) {
    endTimePicker.set('minTime', startTime);
  }
}

function validateForm() {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const playerCount = parseInt(document.getElementById('playerCount').value);

  if (!startDate || !startTime || !endTime || isNaN(playerCount)) {
    alert('Please fill in all required fields.');
    return false;
  }

  if (playerCount > 50 || playerCount < 0) {
    alert('Number of players must be between 0 and 50.');
    return false;
  }

  if (startTime >= endTime) {
    alert('End time must be after start time.');
    return false;
  }

  // تحقق من أن مدة الحجز لا تقل عن ساعة واحدة
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const diffHours = (end - start) / (1000 * 60 * 60);

  if (diffHours < 1) {
    alert('The booking duration must be at least 1 hour.');
    return false;
  }

  if (!isPublic && !document.getElementById('groupPassword').value) {
    alert('Please enter a password for the private group.');
    return false;
  }

  return true;

}

function handleFormSubmission(e) {
  e.preventDefault();

  const button = document.querySelector('.book-button');
  const originalText = button.textContent;

  if (!validateForm()) return;

  button.textContent = 'Processing...';
  button.disabled = true;

  setTimeout(() => {
    button.textContent = 'Booking Confirmed! ✓';
    button.style.background = 'linear-gradient(135deg, var(--success), #16a34a)';

    setTimeout(() => {
      alert('Booking confirmed successfully!');
      button.textContent = originalText;
      button.disabled = false;
      button.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    }, 2000);
  }, 1500);
}

function updateSummary() {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const playerCount = document.getElementById('playerCount').value;

  if (startDate) {
    const dateObj = new Date(startDate);
    document.getElementById('summaryDate').textContent =
      dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  document.getElementById('summaryStartTime').textContent = startTime || '-';
  document.getElementById('summaryEndTime').textContent = endTime || '-';

  if (startTime && endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffHours = (end - start) / (1000 * 60 * 60);

    if (diffHours > 0) {
      document.getElementById('summaryDuration').textContent = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      document.getElementById('summaryTotal').textContent = `₪${diffHours * 120}`;
    } else {
      document.getElementById('summaryDuration').textContent = '-';
      document.getElementById('summaryTotal').textContent = '₪0';
    }
  }

  document.getElementById('summaryPlayers').textContent = playerCount || '0';
  document.getElementById('summaryGroupType').textContent = isPublic ? 'Public' : 'Private';
}
