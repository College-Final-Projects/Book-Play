// Global variables
let venuesData = [];
let sportsData = [];
let map;
let marker;
let geocoder;
let currentEditingId = null;

// DOM elements
const venueGrid = document.getElementById('venueGrid');
const venueModal = document.getElementById('venueModal');
const addVenueBtn = document.querySelector('.add-venue-btn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.querySelector('.cancel-btn');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const sortBySportSelect = document.getElementById('sortbysport');
const modalTitle = document.getElementById('modalTitle');
const venueForm = document.querySelector('form');
const imageInput = document.getElementById('venueImages');
const imagePreview = document.getElementById('imagePreview');

async function initializeApp() {
    window.initializeApp = initializeApp;
    try {
        await loadSports();
        await loadVenues();
        initializeMap();
        setupEventListeners();
        populateSportsFilter();
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}

// Load sports data from server
async function loadSports() {
    try {
        const response = await fetch('fetch_venues.php?action=get_sports');
        if (!response.ok) throw new Error('Failed to fetch sports');
        
        sportsData = await response.json();
        populateSportsDropdown();
    } catch (error) {
        console.error('Error loading sports:', error);
        showMessage('Error loading sports data', 'error');
    }
}

// Load venues data from server
async function loadVenues() {
    try {
        const response = await fetch('fetch_venues.php?action=get_facilities');
        if (!response.ok) throw new Error('Failed to fetch venues');
        
        venuesData = await response.json();
        displayVenues(venuesData);
    } catch (error) {
        console.error('Error loading venues:', error);
        showMessage('Error loading venues data', 'error');
    }
}

// Populate sports dropdown in modal
function populateSportsDropdown() {
    const sportSelect = document.getElementById('sportType');
    sportSelect.innerHTML = '<option value="">Select Sport Type</option>';
    
    sportsData.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sport_name;
        option.textContent = sport.sport_name;
        sportSelect.appendChild(option);
    });
}

// Populate sports filter dropdown
function populateSportsFilter() {
    sortBySportSelect.innerHTML = '<option value="">All Sports</option>';
    
    sportsData.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sport_name;
        option.textContent = sport.sport_name;
        sortBySportSelect.appendChild(option);
    });
}

// Initialize Google Maps
function initializeMap() {
    const defaultLocation = { lat: 32.0853, lng: 34.7818 };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultLocation,
        mapId: 'bec4fd1eef54f71c3e99df68',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });

    marker = new google.maps.marker.AdvancedMarkerElement({
        position: defaultLocation,
        map: map,
        title: 'Venue Location'
    });

    geocoder = new google.maps.Geocoder();

    const locationInput = document.getElementById('locationInput');
    const autocomplete = new google.maps.places.Autocomplete(locationInput);
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function () {
    const place = autocomplete.getPlace();
    
    // ✅ حماية ضد إدخال يدوي بدون اختيار اقتراح
    if (!place.geometry || !place.geometry.location) {
        alert("❌ من فضلك اختر الموقع من القائمة التي تظهر، لا تكتب العنوان يدويًا فقط.");
        document.getElementById('locationInput').value = '';
        return;
    }

    const location = place.geometry.location;
    map.setCenter(location);
    marker.position = location;
    updateCoordinates(location.lat(), location.lng());
});


    map.addListener('click', function(event) {
        updateMarkerPosition(event.latLng);
    });
}

// Update marker position and coordinates
function updateMarkerPosition(latLng) {
    marker.position = latLng;
    updateCoordinates(latLng.lat(), latLng.lng());
    geocoder.geocode({ location: latLng }, function(results, status) {
        if (status === 'OK' && results[0]) {
            document.getElementById('locationInput').value = results[0].formatted_address;
        }
    });
}

// Update hidden coordinate fields
function updateCoordinates(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
}

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    addVenueBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click', () => closeModal());
    
    // Click outside modal to close
    venueModal.addEventListener('click', function(e) {
        if (e.target === venueModal) {
            closeModal();
        }
    });
    
    // Form submission
    venueForm.addEventListener('submit', handleFormSubmit);
    
    // Search and filter
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    sortBySportSelect.addEventListener('change', handleSportFilter);
    
    // Image preview
    imageInput.addEventListener('change', handleImagePreview);
}

// Display venues in grid
function displayVenues(venues) {
    if (venues.length === 0) {
        venueGrid.innerHTML = `
            <div class="no-venues-message">
                <p>No venues found. Click "Add New Venue" to get started!</p>
            </div>
        `;
        return;
    }
    
    venueGrid.innerHTML = venues.map(venue => createVenueCard(venue)).join('');
    
    // Add event listeners to toggle switches and action buttons
    setupVenueCardEventListeners();
}

// Create venue card HTML
function createVenueCard(venue) {
    const images = venue.image_url ? venue.image_url.split(',') : [];
    const firstImage = images.length > 0 ? images[0] : 'placeholder.jpg';
    const isAvailable = venue.is_available == 1;
    
    return `
        <div class="venue-card" data-venue-id="${venue.facilities_id}">
            <div class="venue-image">
                <img src="${firstImage}" alt="${venue.place_name}" onerror="this.src='../../assets/placeholder.jpg'">
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
                        <button class="action-btn edit" onclick="editVenue(${venue.facilities_id})">✏️ Edit</button>
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

// Setup event listeners for venue cards
function setupVenueCardEventListeners() {
    // Event listeners are handled inline in the HTML for simplicity
    // This function can be expanded if needed for more complex event handling
}

// Open modal for adding/editing venue
function openModal(venue = null) {
    currentEditingId = venue ? venue.facilities_id : null;
    modalTitle.textContent = venue ? 'Edit Venue' : 'Add New Venue';
    
    // Reset form
    venueForm.reset();
    imagePreview.innerHTML = '';
    
    if (venue) {
        // Populate form with venue data
        document.getElementById('facilityId').value = venue.facilities_id;
        document.getElementById('placeName').value = venue.place_name;
        document.getElementById('sportType').value = venue.SportCategory;
        document.getElementById('description').value = venue.description || '';
        document.getElementById('price').value = venue.price;
        document.getElementById('locationInput').value = venue.location;
        document.getElementById('isAvailable').checked = venue.is_available == 1;
        
        // Set coordinates if available
        if (venue.latitude && venue.longitude) {
            const lat = parseFloat(venue.latitude);
            const lng = parseFloat(venue.longitude);
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;
            
            // Update map
            const location = new google.maps.LatLng(lat, lng);
            map.setCenter(location);
            marker.position = location;
        }
        
        // Show existing images
        if (venue.image_url) {
            const images = venue.image_url.split(',');
            images.forEach(imageUrl => {
                if (imageUrl.trim()) {
                    const img = document.createElement('img');
                    img.src = imageUrl.trim();
                    img.style.width = '100px';
                    img.style.height = '100px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '10px';
                    imagePreview.appendChild(img);
                }
            });
        }
    } else {
        // Reset for new venue
        document.getElementById('facilityId').value = '';
        // Reset map to default location for new venue
        const defaultLocation = { lat: 32.0853, lng: 34.7818 };
        map.setCenter(defaultLocation);
        marker.position = defaultLocation;
        updateCoordinates(defaultLocation.lat, defaultLocation.lng);
    }
    
    venueModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close modal
function closeModal() {
    venueModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    currentEditingId = null;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(venueForm);
    
    // Determine if we're editing or adding
    if (currentEditingId) {
        formData.append('action', 'update_facility');
        formData.append('facility_id', currentEditingId);
    } else {
        formData.append('action', 'add_facility');
    }
    
    try {
        const response = await fetch('fetch_venues.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            closeModal();
            await loadVenues(); // Reload venues
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving venue:', error);
        showMessage('Error saving venue. Please try again.', 'error');
    }
}

// Handle image preview
function handleImagePreview(e) {
    const files = Array.from(e.target.files);
    imagePreview.innerHTML = '';
    
    // Limit to 3 images
    const limitedFiles = files.slice(0, 3);
    
    limitedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '10px';
                img.style.border = '1px solid #ddd';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    
    if (files.length > 3) {
        showMessage('Only the first 3 images will be uploaded.', 'warning');
    }
}

// Edit venue function
async function editVenue(venueId) {
    const venue = venuesData.find(v => v.facilities_id == venueId);
    if (venue) {
        openModal(venue);
    }
}

// Delete venue function
async function deleteVenue(venueId) {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Note: You'll need to implement delete functionality in your PHP
        // For now, we'll just remove it from the display
        venuesData = venuesData.filter(v => v.facilities_id != venueId);
        displayVenues(venuesData);
        showMessage('Venue deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting venue:', error);
        showMessage('Error deleting venue', 'error');
    }
}

// Toggle venue availability
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
            // Update local data without reloading
            const venue = venuesData.find(v => v.facilities_id == venueId);
            if (venue) {
                venue.is_available = isAvailable ? 1 : 0;
                
                // Update only the specific venue card's status display
                updateVenueCardStatus(venueId, isAvailable);
            }
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
            // Revert the toggle
            const checkbox = document.querySelector(`input[onchange*="${venueId}"]`);
            if (checkbox) {
                checkbox.checked = !isAvailable;
            }
        }
    } catch (error) {
        console.error('Error updating availability:', error);
        showMessage('Error updating availability', 'error');
        // Revert the toggle
        const checkbox = document.querySelector(`input[onchange*="${venueId}"]`);
        if (checkbox) {
            checkbox.checked = !isAvailable;
        }
    }
}

// Update specific venue card status without reloading all cards
function updateVenueCardStatus(venueId, isAvailable) {
    const venueCard = document.querySelector(`[data-venue-id="${venueId}"]`);
    if (venueCard) {
        const statusElement = venueCard.querySelector('.venue-status');
        if (statusElement) {
            // Update status text and class
            statusElement.textContent = isAvailable ? 'Available' : 'Unavailable';
            statusElement.className = `venue-status ${isAvailable ? 'status-available' : 'status-unavailable'}`;
        }
    }
}

// Handle search
function handleSearch() {
    displayVenues(getFilteredVenues());
}

// Handle sorting
function handleSort() {
    displayVenues(getFilteredVenues());
}

// Handle sport filter
function handleSportFilter() {
    displayVenues(getFilteredVenues());
}

// Get filtered and sorted venues
function getFilteredVenues() {
    let filteredVenues = [...venuesData];

    // Apply search filter (startsWith only for place_name)
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm !== '') {
        filteredVenues = filteredVenues.filter(venue =>
            venue.place_name.toLowerCase().startsWith(searchTerm)
        );
    }

    // Apply sport filter
    const selectedSport = sortBySportSelect.value;
    if (selectedSport) {
        filteredVenues = filteredVenues.filter(venue =>
            venue.SportCategory === selectedSport
        );
    }

    return applyFiltersAndSort(filteredVenues);
}



// Apply filters and sorting
function applyFiltersAndSort(venues) {
    const sortBy = sortSelect.value;
    
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

// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Style based on type
    switch (type) {
        case 'success':
            messageDiv.style.borderLeftColor = '#22c55e';
            messageDiv.style.backgroundColor = '#f0f9ff';
            break;
        case 'error':
            messageDiv.style.borderLeftColor = '#ef4444';
            messageDiv.style.backgroundColor = '#fef2f2';
            break;
        case 'warning':
            messageDiv.style.borderLeftColor = '#f59e0b';
            messageDiv.style.backgroundColor = '#fffbeb';
            break;
        default:
            messageDiv.style.borderLeftColor = '#1e90ff';
            messageDiv.style.backgroundColor = '#f8f9fa';
    }
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Utility function to handle errors
function handleError(error, context = '') {
    console.error(`Error ${context}:`, error);
    showMessage(`An error occurred ${context}. Please try again.`, 'error');
}

// Initialize tooltips or other UI enhancements
function initializeUIEnhancements() {
    // Add any additional UI enhancements here
    // For example, tooltips, animations, etc.
}

// Call UI enhancements after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUIEnhancements();
});