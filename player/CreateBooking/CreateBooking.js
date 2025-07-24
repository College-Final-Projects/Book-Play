let isPublic = true;
let startTimePicker, endTimePicker, startDatePicker;
let unavailableRanges = [];

document.addEventListener('DOMContentLoaded', function () {
  initializeDateTimePickers();
  setupEventListeners();
  updateSummary();
});

function initializeDateTimePickers() {
  startDatePicker = flatpickr("#startDate", {
    minDate: "today",
    dateFormat: "Y-m-d",
    onChange: ([selectedDate]) => {
      updateEndTimeMinTime();
      updateSummary();

      if (facilityId && selectedDate) {
        const formattedDate = selectedDate.getFullYear() + '-' +
          String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(selectedDate.getDate()).padStart(2, '0');
        loadUnavailableRanges(facilityId, formattedDate);
      }
    }
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
        window.selectedFacilityPrice = facility.price;

        document.querySelector(".venue-image img").src = facility.image_url || "images/default.jpg";
        document.querySelector(".venue-title").textContent = facility.place_name;
        document.querySelector(".venue-location").textContent = `📍 ${facility.location}`;
        document.querySelector(".venue-price").innerHTML = `₪${facility.price} <span class="per">per hour</span>`;

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
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (startDate === todayStr) {
    const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' +
      Math.floor(now.getMinutes() / 30) * 30
        .toString()
        .padStart(2, '0');
    startTimePicker.set('minTime', currentTimeStr);
    if (startTime < currentTimeStr) {
      startTimePicker.setDate(currentTimeStr, true);
    }
  } else {
    startTimePicker.set('minTime', '00:00');
  }

  if (startTime) {
    endTimePicker.set('minTime', startTime);
  }
}

function validateForm() {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;

  const now = new Date();
  const selectedStartFull = new Date(`${startDate}T${startTime}`);
  if (selectedStartFull < now) {
    alert("Start time cannot be in the past.");
    return false;
  }

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

  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffHours = (end - start) / (1000 * 60 * 60);

  if (diffHours < 1) {
    alert('The booking duration must be at least 1 hour.');
    return false;
  }

  if (!isPublic && !document.getElementById('groupPassword').value) {
    alert('Please enter a password for the private group.');
    return false;
  }

  for (const range of unavailableRanges) {
    const rangeStart = new Date(`2000-01-01T${range.from}`);
    const rangeEnd = new Date(`2000-01-01T${range.to}`);

    if (start < rangeEnd && end > rangeStart) {
      alert(`Selected time ${startTime} → ${endTime} overlaps with unavailable slot ${range.from} → ${range.to}`);
      return false;
    }
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

  const formData = new FormData();
formData.append("facility_id", facilityId);
formData.append("start_date", document.getElementById("startDate").value);
formData.append("start_time", document.getElementById("startTime").value);
formData.append("end_time", document.getElementById("endTime").value);
formData.append("player_count", document.getElementById("playerCount").value);
formData.append("group_type", isPublic ? "public" : "private");
formData.append("group_password", isPublic ? "" : document.getElementById("groupPassword").value);

fetch("CreateBookingAPI.php", {
  method: "POST",
  body: formData
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert(`Booking confirmed successfully!\nYour Booking ID is: ${data.booking_id}`);
    setTimeout(() => {
      window.location.href = "../MyBookings/MyBookings.php";
    }, 2000);
  } else {
    alert("Error: " + data.message);
  }
})
.catch(err => {
  console.error("Booking error", err);
  alert("An error occurred. Try again.");
})
.finally(() => {
  button.textContent = originalText;
  button.disabled = false;
  button.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
});

}

function updateSummary() {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const playerCount = document.getElementById('playerCount').value;

  if (startDate) {
    const dateObj = new Date(startDate);
    document.getElementById('summaryDate').textContent =
      dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
  }

  document.getElementById('summaryStartTime').textContent = startTime || '-';
  document.getElementById('summaryEndTime').textContent = endTime || '-';

  if (startTime && endTime) {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffHours = (end - start) / (1000 * 60 * 60);

    if (diffHours > 0) {
      document.getElementById('summaryDuration').textContent = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      const price = window.selectedFacilityPrice || 0;
document.getElementById('summaryTotal').textContent = `₪${diffHours * price}`;
    } else {
      document.getElementById('summaryDuration').textContent = '-';
      document.getElementById('summaryTotal').textContent = '₪0';
    }
  }

  document.getElementById('summaryPlayers').textContent = playerCount || '0';
  document.getElementById('summaryGroupType').textContent = isPublic ? 'Public' : 'Private';
}

function loadUnavailableRanges(facilityId, bookingDate) {
  fetch(`CreateBookingAPI.php?facility_id=${facilityId}&booking_date=${bookingDate}`)
    .then(res => res.json())
    .then(data => {
      const container = document.querySelector('.unavailable-slots');
      container.innerHTML = '';
      unavailableRanges = [];

      if (data.success && Array.isArray(data.unavailable_ranges)) {
        unavailableRanges = mergeTimeRanges(data.unavailable_ranges);
        unavailableRanges.forEach(range => {
          const slot = document.createElement('div');
          slot.className = 'unavailable-slot';
          slot.textContent = `${range.from} → ${range.to}`;
          container.appendChild(slot);
        });
        updateTimePickersWithUnavailableTimes(unavailableRanges);
      } else {
        container.innerHTML = '<div class="unavailable-slot">No unavailable slots</div>';
        updateTimePickersWithUnavailableTimes([]);
      }
    })
    .catch(err => {
      console.error("Failed to load unavailable ranges", err);
    });
}

function mergeTimeRanges(ranges) {
  if (!ranges.length) return [];

  const sorted = ranges.slice().sort((a, b) => a.from.localeCompare(b.from));
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.from <= last.to) {
      last.to = current.to > last.to ? current.to : last.to;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function updateTimePickersWithUnavailableTimes(ranges) {
  const disabled = ranges.map(range => {
    return {
      from: `2000-01-01T${range.from}`,
      to: `2000-01-01T${range.to}`
    };
  });

  startTimePicker.set('disable', disabled);
  endTimePicker.set('disable', disabled);
}
