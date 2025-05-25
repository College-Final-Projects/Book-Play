document.addEventListener('DOMContentLoaded', () => {
  setupModal();
  loadFacilities();
});

let facilities = []; // Global array to hold facilities
let map;
let marker;
let geocoder;

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

    // Handle multiple images
    const imageUrls = facility.image_url ? facility.image_url.split(',') : [];
    const mainImageUrl = imageUrls[0] || '/api/placeholder/400/320';
    
    const isAvailable = facility.is_available == 1;
    const statusClass = isAvailable ? 'status-available' : 'status-unavailable';
    const statusText = isAvailable ? 'Available' : 'Unavailable';

    venueCard.innerHTML = `
      <div class="venue-image">
        <img src="${mainImageUrl}" alt="${facility.place_name || 'Venue'}">
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
  const locationInput = document.getElementById('locationInput');

  // تهيئة جوجل مابس
  function initMap() {
    // تعريف خريطة افتراضية (تل أبيب)
    const defaultLocation = { lat: 32.0853, lng: 34.7818 };
    
    // إنشاء كائن الخريطة
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: defaultLocation,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false
    });
    
    // إنشاء كائن لتحويل الإحداثيات إلى عناوين والعكس
    geocoder = new google.maps.Geocoder();
    
    // إنشاء علامة (Marker) افتراضية
    marker = new google.maps.Marker({
      position: defaultLocation,
      map: map,
      draggable: true, // يمكن سحب العلامة
      animation: google.maps.Animation.DROP
    });
    
    // الحصول على الموقع الحالي للمستخدم
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // تحديث موقع الخريطة والعلامة
          map.setCenter(userLocation);
          marker.setPosition(userLocation);
          
          // الحصول على العنوان من الإحداثيات
          geocodePosition(userLocation);
        },
        () => {
          alert('Could not get your location. Please select location manually on the map.');
        }
      );
    }
    
    // تحديث الموقع عند النقر على الخريطة
    map.addListener('click', (event) => {
      marker.setPosition(event.latLng);
      geocodePosition(event.latLng);
    });
    
    // تحديث الموقع عند سحب العلامة
    marker.addListener('dragend', () => {
      geocodePosition(marker.getPosition());
    });
    
    // البحث عن العنوان عند كتابته في حقل العنوان
    locationInput.addEventListener('change', () => {
      geocodeAddress(locationInput.value);
    });
  }
  
  // تحويل الإحداثيات إلى عنوان
  function geocodePosition(position) {
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        locationInput.value = results[0].formatted_address;
        
        // تخزين الإحداثيات في حقول مخفية
        document.getElementById('latitude').value = position.lat();
        document.getElementById('longitude').value = position.lng();
      } else {
        console.error('Geocode failed: ' + status);
      }
    });
  }
  
  // تحويل العنوان إلى إحداثيات
  function geocodeAddress(address) {
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const position = results[0].geometry.location;
        map.setCenter(position);
        marker.setPosition(position);
        
        // تخزين الإحداثيات في حقول مخفية
        document.getElementById('latitude').value = position.lat();
        document.getElementById('longitude').value = position.lng();
      } else {
        console.error('Geocode failed: ' + status);
      }
    });
  }

  // Load sports for dropdown
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

  // Image preview functionality
  imageInput.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = imageInput.files;
    const maxFiles = Math.min(3, files.length);

    for (let i = 0; i < maxFiles; i++) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Preview';
        img.style.maxWidth = '100px';
        img.style.margin = '5px';
        preview.appendChild(img);
      };
      reader.readAsDataURL(files[i]);
    }

    if (files.length > 3) {
      const warning = document.createElement('p');
      warning.textContent = '⚠️ Only the first 3 images will be uploaded.';
      warning.style.color = '#e67e22';
      preview.appendChild(warning);
    }
  });

  // Modal open/close functionality
  openBtn.addEventListener('click', () => {
    form.reset();
    preview.innerHTML = '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // تنفيذ دالة تهيئة الخريطة بعد ظهور النموذج
    setTimeout(() => {
      initMap();
    }, 100);
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

  // Form submission
  form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Create a new FormData object from the form
    const formData = new FormData(form);
    
    // Add files to formData
    const files = imageInput.files;
    const maxFiles = Math.min(3, files.length);
    
    // Clear any existing image fields to avoid duplicates
    formData.delete('venueImages[]');
    
    // Add each file individually with the correct field name
    for (let i = 0; i < maxFiles; i++) {
      formData.append('venueImages[]', files[i]);
    }
    
    formData.append('action', 'add_facility');
    
    fetch('fetch_venues.php', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Server response:', data);
      alert(data.message);
      if (data.success) {
        closeModal();
        loadFacilities();
      }
    })
    .catch(error => {
      console.error('Error submitting facility:', error);
      alert('An error occurred while submitting the facility: ' + error.message);
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