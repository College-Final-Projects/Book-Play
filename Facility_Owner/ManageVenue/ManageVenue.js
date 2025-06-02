/**
 * Venue Management System
 * Clean and organized JavaScript code
 */

// ========================
// GLOBAL STATE
// ========================
const AppState = {
    venues: [],
    sports: [],
    map: null,
    marker: null,
    geocoder: null,
    currentEditingId: null
};

// ========================
// DOM REFERENCES
// ========================
const Elements = {
    venueGrid: document.getElementById('venueGrid'),
    venueModal: document.getElementById('venueModal'),
    addVenueBtn: document.querySelector('.add-venue-btn'),
    closeModalBtn: document.getElementById('closeModal'),
    cancelBtn: document.querySelector('.cancel-btn'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    sortBySportSelect: document.getElementById('sortbysport'),
    modalTitle: document.getElementById('modalTitle'),
    venueForm: document.querySelector('form'),
    imageInput: document.getElementById('venueImages'),
    imagePreview: document.getElementById('imagePreview')
};

// ========================
// CONSTANTS
// ========================
const CONFIG = {
    DEFAULT_LOCATION: { lat: 32.0853, lng: 34.7818 },
    MAX_IMAGES: 3,
    MESSAGE_TIMEOUT: 5000,
    MAP_CONFIG: {
        zoom: 13,
        mapId: 'bec4fd1eef54f71c3e99df68',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    }
};

// ========================
// INITIALIZATION
// ========================
async function initializeApp() {
    window.initializeApp = initializeApp;
    
    try {
        await loadSports();
        await loadVenues();
        initializeMap();
        await initMap(); // Initialize the new Place Autocomplete
        setupEventListeners();
        populateSportsFilter();
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}

// ========================
// DATA LOADING
// ========================
async function loadSports() {
    try {
        const response = await fetch('fetch_venues.php?action=get_sports');
        if (!response.ok) throw new Error('Failed to fetch sports');
        
        AppState.sports = await response.json();
        populateSportsDropdown();
    } catch (error) {
        console.error('Error loading sports:', error);
        showMessage('Error loading sports data', 'error');
    }
}

async function loadVenues() {
    try {
        const response = await fetch('fetch_venues.php?action=get_facilities');
        if (!response.ok) throw new Error('Failed to fetch venues');
        
        AppState.venues = await response.json();
        displayVenues(AppState.venues);
    } catch (error) {
        console.error('Error loading venues:', error);
        showMessage('Error loading venues data', 'error');
    }
}

// ========================
// MAP FUNCTIONALITY
// ========================
function initializeMap() {
    AppState.map = new google.maps.Map(document.getElementById('map'), {
        ...CONFIG.MAP_CONFIG,
        center: CONFIG.DEFAULT_LOCATION
    });

    AppState.marker = new google.maps.marker.AdvancedMarkerElement({
        position: CONFIG.DEFAULT_LOCATION,
        map: AppState.map,
        title: 'Venue Location'
    });

    AppState.geocoder = new google.maps.Geocoder();
    setupLocationAutocomplete();
    setupMapClickHandler();
}

async function initMap() {
    // Request needed libraries
    await google.maps.importLibrary("places");
    
    // Create the Place Autocomplete element
    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    
    // Check if there's a specific container, otherwise append to modal or create one
    const container = document.getElementById("autocompleteElement") || 
                     document.getElementById("placeAutocompleteContainer");
    
    if (container) {
        container.replaceWith(placeAutocomplete);
    } else {
        // Create a container in the modal form if it doesn't exist
        const modalForm = document.querySelector('#venueModal form');
        if (modalForm) {
            const autocompleteContainer = document.createElement('div');
            autocompleteContainer.id = 'placeAutocompleteContainer';
            autocompleteContainer.style.marginBottom = '15px';
            
            const label = document.createElement('label');
            label.textContent = 'Search Location:';
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.fontWeight = 'bold';
            
            autocompleteContainer.appendChild(label);
            autocompleteContainer.appendChild(placeAutocomplete);
            
            // Insert before the existing location input
            const locationInput = document.getElementById('locationInput');
            if (locationInput && locationInput.parentNode) {
                locationInput.parentNode.insertBefore(autocompleteContainer, locationInput.parentNode);
            } else {
                modalForm.insertBefore(autocompleteContainer, modalForm.firstChild);
            }
        } else {
            // Fallback: append to body
            document.body.appendChild(placeAutocomplete);
        }
    }

    // Get coordinate input fields
    const selectedLatInput = document.getElementById("latitude");
    const selectedLngInput = document.getElementById("longitude");
    const locationInput = document.getElementById("locationInput");

    // Create info display elements (optional - for debugging)
    const selectedPlaceTitle = document.createElement('p');
    selectedPlaceTitle.id = 'selectedPlaceTitle';
    selectedPlaceTitle.textContent = '';
    selectedPlaceTitle.style.display = 'none'; // Hidden by default
    
    const selectedPlaceInfo = document.createElement('pre');
    selectedPlaceInfo.id = 'selectedPlaceInfo';
    selectedPlaceInfo.textContent = '';
    selectedPlaceInfo.style.display = 'none'; // Hidden by default
    selectedPlaceInfo.style.fontSize = '12px';
    selectedPlaceInfo.style.backgroundColor = '#f5f5f5';
    selectedPlaceInfo.style.padding = '10px';
    selectedPlaceInfo.style.borderRadius = '5px';
    selectedPlaceInfo.style.maxHeight = '200px';
    selectedPlaceInfo.style.overflow = 'auto';

    // Append info elements to modal or body
    const modalContent = document.querySelector('#venueModal .modal-content');
    if (modalContent) {
        modalContent.appendChild(selectedPlaceTitle);
        modalContent.appendChild(selectedPlaceInfo);
    } else {
        document.body.appendChild(selectedPlaceTitle);
        document.body.appendChild(selectedPlaceInfo);
    }

    // Add the place select listener
    placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
        try {
            const place = placePrediction.toPlace();
            await place.fetchFields({ 
                fields: ['displayName', 'formattedAddress', 'location'] 
            });

            // Update coordinate inputs
            const location = place.location;
            if (location?.lat && location?.lng) {
                const lat = location.lat;
                const lng = location.lng;
                
                // Update hidden coordinate fields
                if (selectedLatInput) selectedLatInput.value = lat;
                if (selectedLngInput) selectedLngInput.value = lng;
                
                // Update location input field
                if (locationInput) {
                    locationInput.value = place.formattedAddress || place.displayName;
                }
                
                // Update map if it exists
                if (AppState.map && AppState.marker) {
                    const latLng = { lat, lng };
                    AppState.map.setCenter(latLng);
                    AppState.marker.position = latLng;
                }
                
                // Show selected place info (for debugging - can be removed)
                selectedPlaceTitle.textContent = 'Selected Place:';
                selectedPlaceTitle.style.display = 'block';
                selectedPlaceInfo.textContent = JSON.stringify(
                    place.toJSON(), 
                    null, 
                    2
                );
                selectedPlaceInfo.style.display = 'block';
                
                // Hide info after 3 seconds (optional)
                setTimeout(() => {
                    selectedPlaceTitle.style.display = 'none';
                    selectedPlaceInfo.style.display = 'none';
                }, 3000);
            }
            
            showMessage('Location selected successfully!', 'success');
        } catch (error) {
            console.error('Error selecting place:', error);
            showMessage('Error selecting location. Please try again.', 'error');
        }
    });
}

function setupLocationAutocomplete() {
    const locationInput = document.getElementById('locationInput');
    const autocomplete = new google.maps.places.Autocomplete(locationInput);
    autocomplete.bindTo('bounds', AppState.map);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry?.location) {
            alert("Please select a location from the dropdown suggestions.");
            locationInput.value = '';
            return;
        }

        const location = place.geometry.location;
        AppState.map.setCenter(location);
        AppState.marker.position = location;
        updateCoordinates(location.lat(), location.lng());
    });
}

function setupMapClickHandler() {
    AppState.map.addListener('click', (event) => {
        updateMarkerPosition(event.latLng);
    });
}

function updateMarkerPosition(latLng) {
    AppState.marker.position = latLng;
    updateCoordinates(latLng.lat(), latLng.lng());
    
    AppState.geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('locationInput').value = results[0].formatted_address;
        }
    });
}

function updateCoordinates(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
}

// ========================
// UI POPULATION
// ========================
function populateSportsDropdown() {
    const sportSelect = document.getElementById('sportType');
    sportSelect.innerHTML = '<option value="">Select Sport Type</option>';
    
    AppState.sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sport_name;
        option.textContent = sport.sport_name;
        sportSelect.appendChild(option);
    });
}

function populateSportsFilter() {
    Elements.sortBySportSelect.innerHTML = '<option value="">All Sports</option>';
    
    AppState.sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sport_name;
        option.textContent = sport.sport_name;
        Elements.sortBySportSelect.appendChild(option);
    });
}

// ========================
// VENUE DISPLAY
// ========================
function displayVenues(venues) {
    if (venues.length === 0) {
        Elements.venueGrid.innerHTML = `
            <div class="no-venues-message">
                <p>No venues found. Click "Add New Venue" to get started!</p>
            </div>
        `;
        return;
    }
    
    Elements.venueGrid.innerHTML = venues.map(createVenueCard).join('');
}

function createVenueCard(venue) {
    const images = venue.image_url ? venue.image_url.split(',') : [];
    const firstImage = images.length > 0 ? images[0] : 'placeholder.jpg';
    const isAvailable = venue.is_available == 1;
    
    return `
        <div class="venue-card" data-venue-id="${venue.facilities_id}">
            <div class="venue-image">
                <img src="${firstImage}" alt="${venue.place_name}" 
                     onerror="this.src='../../assets/placeholder.jpg'">
            </div>
            <div class="venue-details">
                <div class="venue-name">
                    <span>${venue.place_name}</span>
                    <span class="venue-status ${isAvailable ? 'status-available' : 'status-unavailable'}">
                        ${isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <div class="venue-info">
                    <p><i>🏃</i><strong>Sport:</strong> ${venue.SportCategory}</p>
                    <p><i>📍</i><strong>Location:</strong> ${venue.location}</p>
                    <p><i>💰</i><strong>Price:</strong> ${venue.price}/hour</p>
                </div>
                <div class="venue-actions">
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editVenue(${venue.facilities_id})">
                            ✏️ Edit
                        </button>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${isAvailable ? 'checked' : ''} 
                               onchange="toggleAvailability(${venue.facilities_id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

// ========================
// MODAL MANAGEMENT
// ========================
function openModal(venue = null) {
    AppState.currentEditingId = venue?.facilities_id || null;
    Elements.modalTitle.textContent = venue ? 'Edit Venue' : 'Add New Venue';
    
    resetForm();
    
    if (venue) {
        populateFormWithVenue(venue);
    } else {
        resetMapToDefault();
    }
    
    Elements.venueModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    Elements.venueModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    AppState.currentEditingId = null;
}

function resetForm() {
    Elements.venueForm.reset();
    Elements.imagePreview.innerHTML = '';
}

function populateFormWithVenue(venue) {
    const fields = {
        'facilityId': venue.facilities_id,
        'placeName': venue.place_name,
        'sportType': venue.SportCategory,
        'description': venue.description || '',
        'price': venue.price,
        'locationInput': venue.location,
        'isAvailable': venue.is_available == 1
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
    
    updateMapForVenue(venue);
    displayExistingImages(venue.image_url);
}

function updateMapForVenue(venue) {
    if (venue.latitude && venue.longitude) {
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);
        
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;
        
        const location = new google.maps.LatLng(lat, lng);
        AppState.map.setCenter(location);
        AppState.marker.position = location;
    }
}

function displayExistingImages(imageUrl) {
    if (!imageUrl) return;
    
    const images = imageUrl.split(',');
    images.forEach(url => {
        if (url.trim()) {
            createImagePreview(url.trim());
        }
    });
}

function resetMapToDefault() {
    document.getElementById('facilityId').value = '';
    AppState.map.setCenter(CONFIG.DEFAULT_LOCATION);
    AppState.marker.position = CONFIG.DEFAULT_LOCATION;
    updateCoordinates(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lng);
}

// ========================
// FORM HANDLING
// ========================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(Elements.venueForm);
    const action = AppState.currentEditingId ? 'update_facility' : 'add_facility';
    
    formData.append('action', action);
    if (AppState.currentEditingId) {
        formData.append('facility_id', AppState.currentEditingId);
    }
    
    try {
        const response = await fetch('fetch_venues.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            closeModal();
            await loadVenues();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving venue:', error);
        showMessage('Error saving venue. Please try again.', 'error');
    }
}

function handleImagePreview(e) {
    const files = Array.from(e.target.files).slice(0, CONFIG.MAX_IMAGES);
    Elements.imagePreview.innerHTML = '';
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => createImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    });
    
    if (e.target.files.length > CONFIG.MAX_IMAGES) {
        showMessage(`Only the first ${CONFIG.MAX_IMAGES} images will be uploaded.`, 'warning');
    }
}

function createImagePreview(src) {
    const img = document.createElement('img');
    Object.assign(img.style, {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '10px',
        border: '1px solid #ddd'
    });
    img.src = src;
    Elements.imagePreview.appendChild(img);
}

// ========================
// VENUE ACTIONS
// ========================
async function editVenue(venueId) {
    const venue = AppState.venues.find(v => v.facilities_id == venueId);
    if (venue) {
        openModal(venue);
    }
}

async function toggleAvailability(venueId, isAvailable) {
    try {
        const formData = new FormData();
        formData.append('action', 'update_availability');
        formData.append('facility_id', venueId);
        formData.append('is_available', isAvailable ? 1 : 0);
        
        const response = await fetch('fetch_venues.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateLocalVenueData(venueId, isAvailable);
            updateVenueCardStatus(venueId, isAvailable);
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
            revertToggle(venueId, !isAvailable);
        }
    } catch (error) {
        console.error('Error updating availability:', error);
        showMessage('Error updating availability', 'error');
        revertToggle(venueId, !isAvailable);
    }
}

function updateLocalVenueData(venueId, isAvailable) {
    const venue = AppState.venues.find(v => v.facilities_id == venueId);
    if (venue) {
        venue.is_available = isAvailable ? 1 : 0;
    }
}

function updateVenueCardStatus(venueId, isAvailable) {
    const statusElement = document.querySelector(`[data-venue-id="${venueId}"] .venue-status`);
    if (statusElement) {
        statusElement.textContent = isAvailable ? 'Available' : 'Unavailable';
        statusElement.className = `venue-status ${isAvailable ? 'status-available' : 'status-unavailable'}`;
    }
}

function revertToggle(venueId, originalState) {
    const checkbox = document.querySelector(`input[onchange*="${venueId}"]`);
    if (checkbox) {
        checkbox.checked = originalState;
    }
}

// ========================
// FILTERING & SEARCHING
// ========================
function getFilteredVenues() {
    let filtered = [...AppState.venues];
    
    // Apply search filter
    const searchTerm = Elements.searchInput.value.trim().toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(venue =>
            venue.place_name.toLowerCase().startsWith(searchTerm)
        );
    }
    
    // Apply sport filter
    const selectedSport = Elements.sortBySportSelect.value;
    if (selectedSport) {
        filtered = filtered.filter(venue =>
            venue.SportCategory === selectedSport
        );
    }
    
    return applySorting(filtered);
}

function applySorting(venues) {
    const sortBy = Elements.sortSelect.value;
    
    return venues.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.place_name.localeCompare(b.place_name);
            case 'name-desc':
                return b.place_name.localeCompare(a.place_name);
            case 'price':
                return parseFloat(a.price) - parseFloat(b.price);
            case 'price-desc':
                return parseFloat(b.price) - parseFloat(a.price);
            default:
                return 0;
        }
    });
}

function handleSearch() {
    displayVenues(getFilteredVenues());
}

function handleSort() {
    displayVenues(getFilteredVenues());
}

function handleSportFilter() {
    displayVenues(getFilteredVenues());
}

// ========================
// EVENT LISTENERS
// ========================
function setupEventListeners() {
    // Modal controls
    Elements.addVenueBtn.addEventListener('click', () => openModal());
    Elements.closeModalBtn.addEventListener('click', closeModal);
    Elements.cancelBtn.addEventListener('click', closeModal);
    
    // Close modal on backdrop click
    Elements.venueModal.addEventListener('click', (e) => {
        if (e.target === Elements.venueModal) closeModal();
    });
    
    // Form submission
    Elements.venueForm.addEventListener('submit', handleFormSubmit);
    
    // Search and filter
    Elements.searchInput.addEventListener('input', handleSearch);
    Elements.sortSelect.addEventListener('change', handleSort);
    Elements.sortBySportSelect.addEventListener('change', handleSportFilter);
    
    // Image preview
    Elements.imageInput.addEventListener('change', handleImagePreview);
}

// ========================
// UTILITY FUNCTIONS
// ========================
function showMessage(message, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message');
    if (existing) existing.remove();
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Apply styling
    const styles = {
        success: { borderLeftColor: '#22c55e', backgroundColor: '#f0f9ff' },
        error: { borderLeftColor: '#ef4444', backgroundColor: '#fef2f2' },
        warning: { borderLeftColor: '#f59e0b', backgroundColor: '#fffbeb' },
        info: { borderLeftColor: '#1e90ff', backgroundColor: '#f8f9fa' }
    };
    
    Object.assign(messageDiv.style, styles[type] || styles.info);
    
    // Insert message
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove
    setTimeout(() => messageDiv.remove(), CONFIG.MESSAGE_TIMEOUT);
}

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    // Any additional UI enhancements can go here
});

// Expose global functions for Google Maps and inline event handlers
window.initMap = initMap;
window.editVenue = editVenue;
window.toggleAvailability = toggleAvailability;