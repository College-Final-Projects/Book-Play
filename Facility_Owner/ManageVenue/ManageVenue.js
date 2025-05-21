document.addEventListener('DOMContentLoaded', () => {
  setupModal();
  loadFacilities();
});

let facilities = []; // Global array to hold facilities

function loadFacilities() {
  fetch('fetch_venues.php?action=get_facilities')
    .then(response => response.json())
    .then(data => {
      facilities = data; // Save to global variable
      displayVenues();
    })
    .catch(error => {
      console.error('Error loading facilities:', error);
      const venueGrid = document.getElementById('venueGrid');
      if (venueGrid) {
        venueGrid.innerHTML = '<div class="no-venues-message">Failed to load venues. Please try again later.</div>';
      }
    });
}

function displayVenues() {
  const venueGrid = document.getElementById('venueGrid');
  if (!venueGrid) return;

  venueGrid.innerHTML = '';

  if (!facilities || facilities.length === 0) {
    venueGrid.innerHTML = '<div class="no-venues-message">You have no venues yet. Click "Add New Venue" to create one.</div>';
    return;
  }

  facilities.forEach(facility => {
    const venueCard = document.createElement('div');
    venueCard.className = 'venue-card';
    venueCard.dataset.id = facility.facilities_id;
    venueCard.dataset.name = (facility.place_name || '').toLowerCase();
    venueCard.dataset.sport = (facility.SportCategory || '').toLowerCase();
    venueCard.dataset.location = (facility.location || '').toLowerCase();
    venueCard.dataset.price = facility.price || 0;

    const imageUrl = facility.image_url?.split(',')[0] || '/api/placeholder/400/320';
    const isAvailable = facility.is_available == 1;
    const statusClass = isAvailable ? 'status-available' : 'status-unavailable';
    const statusText = isAvailable ? 'Available' : 'Unavailable';

    venueCard.innerHTML = `
      <div class="venue-image">
        <img src="${imageUrl}" alt="${facility.place_name || 'Venue'}">
      </div>
      <div class="venue-details">
        <div class="venue-name">
          ${facility.place_name || 'Unnamed Venue'}
          <span class="venue-status ${statusClass}">${statusText}</span>
        </div>
        <div class="venue-info">
          <p>${facility.SportCategory || 'Unknown Sport'}</p>
          <p><i>📍</i> ${facility.location || 'No location provided'}</p>
          <p class="venue-price">$${facility.price || 0} Per Hour</p>
        </div>
        <div class="venue-actions">
          <div class="action-buttons">
            <button class="action-btn edit" data-id="${facility.facilities_id}">✏️ Edit</button>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${isAvailable ? 'checked' : ''} 
              data-id="${facility.facilities_id}" 
              onchange="toggleAvailability(this)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;

    venueGrid.appendChild(venueCard);
  });

  setupEditButtons();
}

function setupModal() {
  const modal = document.getElementById('venueModal');
  const openBtn = document.querySelector('.add-venue-btn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const form = modal.querySelector('form');
  const sportTypeSelect = document.getElementById('sportType');
  const imageInput = document.getElementById('venueImages');
  const preview = document.getElementById('imagePreview');

  fetch('fetch_venues.php?action=get_sports')
    .then(res => res.json())
    .then(sports => {
      sportTypeSelect.innerHTML = '';
      sports.forEach(sport => {
        const opt = document.createElement('option');
        opt.value = sport.sport_id;
        opt.textContent = sport.sport_name;
        sportTypeSelect.appendChild(opt);
      });
    });

  imageInput.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = imageInput.files;
    for (let i = 0; i < Math.min(3, files.length); i++) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Preview';
        preview.appendChild(img);
      };
      reader.readAsDataURL(files[i]);
    }
  });

  openBtn.addEventListener('click', () => {
    form.reset();
    preview.innerHTML = '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    formData.append('action', 'add_facility');

    fetch('fetch_venues.php', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          closeModal();
          loadFacilities();
        }
      })
      .catch(err => {
        console.error('Error submitting facility:', err);
        alert('An error occurred while submitting the facility.');
      });
  });
}

function setupEditButtons() {
  // You can implement edit logic here if needed
  console.log('Edit buttons ready');
}

function toggleAvailability(el) {
  const facilityId = el.dataset.id;
  const isAvailable = el.checked ? 1 : 0;
  const formData = new FormData();
  formData.append('action', 'update_availability');
  formData.append('facility_id', facilityId);
  formData.append('is_available', isAvailable);

  fetch('fetch_venues.php', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      console.log(data.message);
    })
    .catch(err => console.error('Failed to update availability:', err));
}
