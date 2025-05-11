document.addEventListener('DOMContentLoaded', function() {
    // Check if facilities and sports exist
    if (typeof facilities === 'undefined' || typeof sports === 'undefined') {
        console.error('Error: facilities or sports data is not defined');
        // Show error message to user
        const venueGrid = document.getElementById('venueGrid');
        if (venueGrid) {
            venueGrid.innerHTML = '<div class="no-venues-message">Unable to load venue data. Please refresh the page.</div>';
        }
        return;
    }
    
    // Initialize the venue display
    displayVenues();
    
    // Populate sport dropdown
    populateSportDropdown();
    
    // Add event listeners
    const addVenueBtn = document.querySelector('.add-venue-btn');
    if (addVenueBtn) {
        addVenueBtn.addEventListener('click', openAddModal);
    }
    
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterVenues);
    }
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortVenues);
    }
    
    const venueImagesInput = document.getElementById('venueImages');
    if (venueImagesInput) {
        venueImagesInput.addEventListener('change', previewImages);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('venueModal');
        if (modal && e.target === modal) {
            closeModal();
        }
    });
});

// Global variables for map
let map;
let marker;

// Display venues in the grid
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
        venueCard.dataset.name = (facility.place_name || '').toLowerCase();
        venueCard.dataset.sport = (facility.SportCategory || '').toLowerCase();
        venueCard.dataset.location = (facility.location || '').toLowerCase();
        venueCard.dataset.price = facility.price || 0;
        
        // Set default image if none provided
        const imageUrl = facility.image_url || '/api/placeholder/400/320';
        
        // Create venue card HTML
        venueCard.innerHTML = `
            <div class="venue-image">
                <img src="${imageUrl}" alt="${facility.place_name || 'Venue'}">
            </div>
            <div class="venue-details">
                <div class="venue-name">
                    ${facility.place_name || 'Unnamed Venue'}
                    <span class="venue-status ${facility.is_available == 1 ? 'status-available' : 'status-unavailable'}">
                        ${facility.is_available == 1 ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <div class="venue-info">
                    <p><i>🏀</i> ${facility.SportCategory || 'Unknown Sport'}</p>
                    <p><i>📍</i> ${facility.location || 'No location provided'}</p>
                    <p class="venue-price">$${facility.price || 0} Per Hour</p>
                </div>
                <div class="venue-actions">
                    <div class="action-buttons">
                        <button class="action-btn edit" data-id="${facility.facilities_id}">✏️ Edit</button>
                        <form method="POST" style="display: inline;">
                            <input type="hidden" name="facility_id" value="${facility.facilities_id}">
                            <input type="hidden" name="delete_facility" value="1">
                            <button type="submit" class="action-btn delete">🗑️ Delete</button>
                        </form>
                    </div>
                    <form method="POST" class="toggle-form">
                        <input type="hidden" name="facility_id" value="${facility.facilities_id}">
                        <input type="hidden" name="is_available" value="${facility.is_available == 1 ? 0 : 1}">
                        <input type="hidden" name="toggle_availability" value="1">
                        <label class="toggle-switch">
                            <input type="checkbox" ${facility.is_available == 1 ? 'checked' : ''} onclick="this.form.submit();">
                            <span class="toggle-slider"></span>
                        </label>
                    </form>
                </div>
            </div>
        `;
        
        venueGrid.appendChild(venueCard);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.addEventListener('click', function() {
            const facilityId = this.getAttribute('data-id');
            openEditModal(facilityId);
        });
    });
    
    // Add confirmation to delete buttons
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.closest('form').addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to delete this venue?')) {
                e.preventDefault();
            }
        });
    });
}

// Populate sport dropdown
function populateSportDropdown() {
    const sportSelect = document.getElementById('sportType');
    if (!sportSelect || !sports || !Array.isArray(sports)) return;
    
    sportSelect.innerHTML = '';
    
    sports.forEach(sport => {
        if (sport) {
            const option = document.createElement('option');
            option.value = sport;
            option.textContent = sport;
            sportSelect.appendChild(option);
        }
    });
}

// Filter venues based on search input
function filterVenues() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    const venueCards = document.querySelectorAll('.venue-card');
    
    venueCards.forEach(card => {
        const name = card.dataset.name || '';
        const sport = card.dataset.sport || '';
        const location = card.dataset.location || '';
        
        if (name.includes(searchValue) || 
            sport.includes(searchValue) || 
            location.includes(searchValue)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Sort venues based on selected criteria
function sortVenues() {
    const sortSelect = document.getElementById('sortSelect');
    const venueGrid = document.getElementById('venueGrid');
    if (!sortSelect || !venueGrid) return;
    
    const sortValue = sortSelect.value;
    const venueCards = Array.from(document.querySelectorAll('.venue-card'));
    
    venueCards.sort((a, b) => {
        if (sortValue === 'name') {
            return (a.dataset.name || '').localeCompare(b.dataset.name || '');
        } else if (sortValue === 'name-desc') {
            return (b.dataset.name || '').localeCompare(a.dataset.name || '');
        } else if (sortValue === 'price') {
            return parseFloat(a.dataset.price || 0) - parseFloat(b.dataset.price || 0);
        } else if (sortValue === 'price-desc') {
            return parseFloat(b.dataset.price || 0) - parseFloat(a.dataset.price || 0);
        }
        return 0;
    });
    
    venueCards.forEach(card => {
        venueGrid.appendChild(card);
    });
}

// Open modal for adding a new venue
function openAddModal() {
    const modalTitle = document.getElementById('modalTitle');
    const facilityId = document.getElementById('facilityId');
    const placeName = document.getElementById('placeName');
    const description = document.getElementById('description');
    const price = document.getElementById('price');
    const isAvailable = document.getElementById('isAvailable');
    const locationInput = document.getElementById('locationInput');
    const imagePreview = document.getElementById('imagePreview');
    const venueModal = document.getElementById('venueModal');
    
    if (!modalTitle || !facilityId || !placeName || !venueModal) return;
    
    modalTitle.textContent = 'Add New Venue';
    facilityId.value = '';
    placeName.value = '';
    if (description) description.value = '';
    if (price) price.value = '';
    if (isAvailable) isAvailable.checked = true;
    if (locationInput) locationInput.value = '';
    if (imagePreview) imagePreview.innerHTML = '';
    
    venueModal.style.display = 'flex';
    openMap();
}

// Open modal for editing an existing venue
function openEditModal(facilityId) {
    if (!facilities || !Array.isArray(facilities)) return;
    
    const facility = facilities.find(f => f.facilities_id == facilityId);
    if (!facility) return;
    
    const modalTitleElem = document.getElementById('modalTitle');
    const facilityIdElem = document.getElementById('facilityId');
    const placeNameElem = document.getElementById('placeName');
    const sportSelect = document.getElementById('sportType');
    const descriptionElem = document.getElementById('description');
    const priceElem = document.getElementById('price');
    const isAvailableElem = document.getElementById('isAvailable');
    const locationInputElem = document.getElementById('locationInput');
    const imagePreviewElem = document.getElementById('imagePreview');
    const venueModalElem = document.getElementById('venueModal');
    
    if (!modalTitleElem || !facilityIdElem || !placeNameElem || !venueModalElem) return;
    
    modalTitleElem.textContent = 'Edit Venue';
    facilityIdElem.value = facility.facilities_id;
    placeNameElem.value = facility.place_name || '';
    
    // Set sport type
    if (sportSelect && facility.SportCategory) {
        for (let i = 0; i < sportSelect.options.length; i++) {
            if (sportSelect.options[i].value === facility.SportCategory) {
                sportSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    if (descriptionElem) descriptionElem.value = facility.description || '';
    if (priceElem) priceElem.value = facility.price || '';
    if (isAvailableElem) isAvailableElem.checked = facility.is_available == 1;
    if (locationInputElem) locationInputElem.value = facility.location || '';
    if (imagePreviewElem) imagePreviewElem.innerHTML = '';
    
    venueModalElem.style.display = 'flex';
    openMap();
    
    // If location exists, update map
    if (facility.location && window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: facility.location }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const position = results[0].geometry.location;
                if (map) {
                    map.setCenter(position);
                    map.setZoom(15);
                    marker.setPosition(position);
                }
            }
        });
    }
}

// Close the modal
function closeModal() {
    const venueModal = document.getElementById('venueModal');
    if (venueModal) {
        venueModal.style.display = 'none';
    }
}

// Initialize Google Map
function initMap() {
    if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York

    map = new google.maps.Map(mapElement, {
        center: defaultLocation,
        zoom: 13,
    });

    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,
    });

    const input = document.getElementById('locationInput');
    if (input) {
        const autocomplete = new google.maps.places.Autocomplete(input, {
            fields: ['geometry', 'formatted_address'],
            types: ['geocode']
        });
        
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
        
            if (!place.geometry || !place.geometry.location) {
                alert('No location found.');
                return;
            }
        
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            marker.setPosition(place.geometry.location);
        
            input.value = place.formatted_address;
        });

        const geocoder = new google.maps.Geocoder();
        marker.addListener('dragend', function () {
            const position = marker.getPosition();
            geocoder.geocode({ location: position }, function (results, status) {
                if (status === 'OK' && results[0]) {
                    input.value = results[0].formatted_address;
                }
            });
        });
    }
}

// Load map when the modal is opened
function openMap() {
    setTimeout(() => {
        if (window.google && window.google.maps) {
            if (!map) {
                initMap();
            } else {
                const mapElement = document.getElementById('map');
                if (mapElement && google.maps.event) {
                    google.maps.event.trigger(map, 'resize');
                }
            }
        }
    }, 300);
}

// Preview uploaded images
function previewImages(event) {
    if (!event || !event.target || !event.target.files) return;
    
    const files = event.target.files;
    const previewContainer = document.getElementById('imagePreview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (files.length > 3) {
        alert('You can only upload up to 3 images.');
        event.target.value = ''; // reset input
        return;
    }
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (!e || !e.target || !e.target.result) return;
            
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}