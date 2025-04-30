// FreshGlow UI - Manage Venue JavaScript

// Mock data for venues (would normally come from a backend)
let venues = [
    {
        id: 1,
        name: "Downtown Basketball Court",
        sport: "basketball",
        image: "https://via.placeholder.com/800x450?text=Basketball+Court",
        location: "123 Main St, Downtown",
        description: "A premium indoor basketball court with professional flooring and facilities.",
        hourlyPrice: 65,
        isAvailable: true,
        rating: 4.8,
        bookings: 247,
        views: 1893,
        facilities: {
            lights: true,
            parking: true,
            changingRooms: true,
            water: true
        }
    },
    {
        id: 2,
        name: "Sunset Tennis Club",
        sport: "tennis",
        image: "https://via.placeholder.com/800x450?text=Tennis+Court",
        location: "456 Park Avenue, Westside",
        description: "Beautiful outdoor tennis courts with stunning sunset views. Perfect for evening games.",
        hourlyPrice: 40,
        isAvailable: true,
        rating: 4.6,
        bookings: 189,
        views: 1256,
        facilities: {
            lights: true,
            parking: true,
            changingRooms: false,
            water: true
        }
    },
    {
        id: 3,
        name: "Riverside Football Field",
        sport: "football",
        image: "https://via.placeholder.com/800x450?text=Football+Field",
        location: "789 River Road, Eastside",
        description: "Large football field with riverside views. Available for team practice and matches.",
        hourlyPrice: 120,
        isAvailable: false,
        rating: 4.5,
        bookings: 325,
        views: 2540,
        facilities: {
            lights: true,
            parking: true,
            changingRooms: true,
            water: true
        }
    },
    {
        id: 4,
        name: "City Badminton Center",
        sport: "badminton",
        image: "https://via.placeholder.com/800x450?text=Badminton+Court",
        location: "101 Sports Avenue, Northside",
        description: "Modern indoor badminton courts with professional equipment and amenities.",
        hourlyPrice: 35,
        isAvailable: true,
        rating: 4.9,
        bookings: 412,
        views: 3027,
        facilities: {
            lights: true,
            parking: true,
            changingRooms: true,
            water: true
        }
    }
];

// DOM Elements
const venueCardsContainer = document.getElementById('venueCardsContainer');
const addVenueBtn = document.getElementById('addVenueBtn');
const editVenueModal = document.getElementById('editVenueModal');
const confirmationModal = document.getElementById('confirmationModal');
const modalCloseButtons = document.querySelectorAll('.close-modal');
const venueForm = document.getElementById('venueForm');
const cancelBtn = document.getElementById('cancelBtn');
const saveVenueBtn = document.getElementById('saveVenueBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const venueSearch = document.getElementById('venueSearch');
const sortBy = document.getElementById('sortBy');
const venueImage = document.getElementById('venueImage');
const imagePreview = document.getElementById('imagePreview');
const locationInput = document.getElementById('location');
const mapContainer = document.getElementById('mapContainer');

// Google Maps Variables
let map;
let marker;
let geocoder;
let autocomplete;

let currentVenueId = null;
let isEditMode = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    renderVenueCards();
    setupEventListeners();
    initializeGoogleMaps();
});

// Event Listeners
function setupEventListeners() {
    // Add new venue button
    addVenueBtn.addEventListener('click', () => openAddVenueModal());
    
    // Close modal buttons
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(editVenueModal);
            closeModal(confirmationModal);
        });
    });
    
    // Cancel button in venue form
    cancelBtn.addEventListener('click', () => closeModal(editVenueModal));
    
    // Save venue button
    venueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveVenue();
    });
    
    // Cancel delete button
    cancelDeleteBtn.addEventListener('click', () => closeModal(confirmationModal));
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', () => {
        deleteVenue(currentVenueId);
        closeModal(confirmationModal);
    });
    
    // Search input
    venueSearch.addEventListener('input', debounce(() => {
        filterVenues();
    }, 300));
    
    // Sort select
    sortBy.addEventListener('change', () => {
        sortVenues();
    });
    
    // Image upload preview
    venueImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Venue Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Render all venue cards
function renderVenueCards() {
    venueCardsContainer.innerHTML = '';
    
    if (venues.length === 0) {
        venueCardsContainer.innerHTML = `
            <div class="no-venues">
                <i class="bi bi-calendar-x"></i>
                <h3>No venues found</h3>
                <p>Add your first venue to get started!</p>
            </div>
        `;
        return;
    }
    
    venues.forEach(venue => {
        const venueCard = createVenueCard(venue);
        venueCardsContainer.appendChild(venueCard);
    });
}

// Create a single venue card
function createVenueCard(venue) {
    const card = document.createElement('div');
    card.className = 'venue-card';
    card.dataset.id = venue.id;
    
    // Get sport icon based on type
    const sportIcon = getSportIcon(venue.sport);
    
    // Status class and text
    const statusClass = venue.isAvailable ? 'available' : 'unavailable';
    const statusText = venue.isAvailable ? 'Available' : 'Unavailable';
    const statusIcon = venue.isAvailable ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
    
    card.innerHTML = `
        <img src="${venue.image}" alt="${venue.name}" class="venue-image">
        <div class="venue-details">
            <div class="venue-header">
                <div class="venue-title-section">
                    <h3>${venue.name}</h3>
                    <div class="venue-sport">
                        <i class="bi ${sportIcon}"></i> ${capitalizeFirstLetter(venue.sport)}
                    </div>
                </div>
                <div class="venue-status ${statusClass}">
                    <i class="bi ${statusIcon}"></i> ${statusText}
                </div>
            </div>
            
            <div class="venue-info">
                <div class="venue-location">
                    <i class="bi bi-geo-alt"></i> ${venue.location}
                </div>
                <div class="venue-rating">
                    <i class="bi bi-star-fill"></i> ${venue.rating.toFixed(1)}
                </div>
            </div>
            
            <div class="venue-stats">
                <div class="stat-item">
                    <span class="stat-value">$${venue.hourlyPrice}</span>
                    <span class="stat-label">Per Hour</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${venue.bookings}</span>
                    <span class="stat-label">Bookings</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${venue.views}</span>
                    <span class="stat-label">Views</span>
                </div>
            </div>
            
            <div class="venue-actions">
                <div class="action-btns">
                    <button class="edit-btn" onclick="editVenue(${venue.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="confirmDelete(${venue.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
                
                <label class="toggle-switch">
                    <input type="checkbox" ${venue.isAvailable ? 'checked' : ''} onchange="toggleVenueAvailability(${venue.id}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
    `;
    
    return card;
}

// Open add venue modal
function openAddVenueModal() {
    isEditMode = false;
    document.getElementById('modalTitle').textContent = 'Add New Venue';
    document.getElementById('saveVenueBtn').textContent = 'Add Venue';
    
    // Reset form
    venueForm.reset();
    imagePreview.innerHTML = `<i class="bi bi-image"></i><span>No image selected</span>`;
    
    // Set default image
    document.getElementById('venueId').value = '';
    
    openModal(editVenueModal);
    
    // Reset map to default location
    setTimeout(() => {
        const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
        map.setCenter(defaultLocation);
        marker.setPosition(defaultLocation);
        map.setZoom(13);
    }, 300);
}

// Edit venue
function editVenue(id) {
    isEditMode = true;
    currentVenueId = id;
    const venue = venues.find(v => v.id === id);
    
    if (!venue) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Venue';
    document.getElementById('saveVenueBtn').textContent = 'Save Changes';
    
    // Fill form with venue data
    document.getElementById('venueId').value = venue.id;
    document.getElementById('venueName').value = venue.name;
    document.getElementById('sportType').value = venue.sport;
    document.getElementById('venueDescription').value = venue.description;
    document.getElementById('hourlyPrice').value = venue.hourlyPrice;
    document.getElementById('availability').checked = venue.isAvailable;
    document.getElementById('location').value = venue.location;
    
    // Set facilities
    document.getElementById('facilityLights').checked = venue.facilities.lights;
    document.getElementById('facilityParking').checked = venue.facilities.parking;
    document.getElementById('facilityChangingRooms').checked = venue.facilities.changingRooms;
    document.getElementById('facilityWater').checked = venue.facilities.water;
    
    // Show image preview
    imagePreview.innerHTML = `<img src="${venue.image}" alt="${venue.name}">`;
    
    openModal(editVenueModal);
    
    // Update map location after modal is open
    setTimeout(() => {
        updateMapLocation(venue.location);
    }, 300);
}

// Save venue (add or update)
function saveVenue() {
    const venueId = document.getElementById('venueId').value;
    const venueName = document.getElementById('venueName').value;
    const sportType = document.getElementById('sportType').value;
    const venueDescription = document.getElementById('venueDescription').value;
    const hourlyPrice = parseFloat(document.getElementById('hourlyPrice').value);
    const isAvailable = document.getElementById('availability').checked;
    const location = document.getElementById('location').value;
    
    // Get current marker position for more precise location data
    const markerPosition = marker.getPosition();
    const coordinates = markerPosition ? {
        lat: markerPosition.lat(),
        lng: markerPosition.lng()
    } : null;
    
    // Get facilities
    const facilities = {
        lights: document.getElementById('facilityLights').checked,
        parking: document.getElementById('facilityParking').checked,
        changingRooms: document.getElementById('facilityChangingRooms').checked,
        water: document.getElementById('facilityWater').checked
    };
    
    // Get image from preview or use placeholder
    let imageUrl = "https://via.placeholder.com/800x450?text=" + sportType.charAt(0).toUpperCase() + sportType.slice(1);
    
    // If there's an image in the preview and it's not the default icon
    const previewImg = imagePreview.querySelector('img');
    if (previewImg) {
        imageUrl = previewImg.src;
    }
    
    // Create venue object
    const venueData = {
        name: venueName,
        sport: sportType,
        image: imageUrl,
        location: location,
        coordinates: coordinates,
        description: venueDescription,
        hourlyPrice: hourlyPrice,
        isAvailable: isAvailable,
        rating: isEditMode ? venues.find(v => v.id === parseInt(venueId)).rating : (4 + Math.random()).toFixed(1),
        bookings: isEditMode ? venues.find(v => v.id === parseInt(venueId)).bookings : Math.floor(Math.random() * 300),
        views: isEditMode ? venues.find(v => v.id === parseInt(venueId)).views : Math.floor(Math.random() * 2000),
        facilities: facilities
    };
    
    if (isEditMode) {
        // Update existing venue
        const index = venues.findIndex(v => v.id === parseInt(venueId));
        if (index !== -1) {
            venueData.id = parseInt(venueId);
            venues[index] = venueData;
            
            // Show success message
            showToast('Venue updated successfully!', 'success');
        }
    } else {
        // Add new venue
        venueData.id = generateVenueId();
        venues.push(venueData);
        
        // Show success message
        showToast('New venue added successfully!', 'success');
    }
    
    // Re-render venues and close modal
    renderVenueCards();
    closeModal(editVenueModal);
}

// Generate a new venue ID
function generateVenueId() {
    return venues.length > 0 ? Math.max(...venues.map(v => v.id)) + 1 : 1;
}

// Confirm delete
function confirmDelete(id) {
    currentVenueId = id;
    openModal(confirmationModal);
}

// Delete venue
function deleteVenue(id) {
    venues = venues.filter(venue => venue.id !== id);
    renderVenueCards();
    
    // Show success message
    showToast('Venue deleted successfully!', 'success');
}

// Toggle venue availability
function toggleVenueAvailability(id, isAvailable) {
    const venue = venues.find(v => v.id === id);
    if (venue) {
        venue.isAvailable = isAvailable;
        
        // Update the venue card status without re-rendering all cards
        const card = document.querySelector(`.venue-card[data-id="${id}"]`);
        if (card) {
            const statusDiv = card.querySelector('.venue-status');
            const statusIcon = card.querySelector('.venue-status i');
            
            if (isAvailable) {
                statusDiv.className = 'venue-status available';
                statusDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i> Available';
            } else {
                statusDiv.className = 'venue-status unavailable';
                statusDiv.innerHTML = '<i class="bi bi-x-circle-fill"></i> Unavailable';
            }
        }
        
        // Show status update message
        const statusText = isAvailable ? 'available' : 'unavailable';
        showToast(`Venue is now ${statusText}`, 'info');
    }
}

// Filter venues based on search input
function filterVenues() {
    const searchTerm = venueSearch.value.toLowerCase();
    
    const filteredVenues = venues.filter(venue => {
        return venue.name.toLowerCase().includes(searchTerm) ||
               venue.sport.toLowerCase().includes(searchTerm) ||
               venue.location.toLowerCase().includes(searchTerm);
    });
    
    venueCardsContainer.innerHTML = '';
    
    if (filteredVenues.length === 0) {
        venueCardsContainer.innerHTML = `
            <div class="no-venues">
                <i class="bi bi-search"></i>
                <h3>No venues found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }
    
    filteredVenues.forEach(venue => {
        const venueCard = createVenueCard(venue);
        venueCardsContainer.appendChild(venueCard);
    });
}

// Sort venues based on selected option
function sortVenues() {
    const sortOption = sortBy.value;
    let sortedVenues = [...venues];
    
    switch (sortOption) {
        case 'popularity':
            sortedVenues.sort((a, b) => b.bookings - a.bookings);
            break;
        case 'rating':
            sortedVenues.sort((a, b) => b.rating - a.rating);
            break;
        case 'alphabetical':
            sortedVenues.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    venueCardsContainer.innerHTML = '';
    sortedVenues.forEach(venue => {
        const venueCard = createVenueCard(venue);
        venueCardsContainer.appendChild(venueCard);
    });
}

// Open modal
function openModal(modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// Close modal
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Show toast message
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add toast container styles
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .toast {
                padding: 15px 20px;
                margin-bottom: 10px;
                border-radius: 10px;
                background: white;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
                opacity: 0;
                width: 300px;
            }
            
            .toast.success {
                border-left: 4px solid #22c55e;
            }
            
            .toast.info {
                border-left: 4px solid #1e90ff;
            }
            
            .toast.error {
                border-left: 4px solid #ef4444;
            }
            
            .toast i {
                font-size: 20px;
            }
            
            .toast.success i {
                color: #22c55e;
            }
            
            .toast.info i {
                color: #1e90ff;
            }
            
            .toast.error i {
                color: #ef4444;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'bi-check-circle-fill';
            break;
        case 'info':
            icon = 'bi-info-circle-fill';
            break;
        case 'error':
            icon = 'bi-exclamation-circle-fill';
            break;
        default:
            icon = 'bi-info-circle-fill';
    }
    
    toast.innerHTML = `
        <i class="bi ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Helper functions
function getSportIcon(sport) {
    switch (sport) {
        case 'football':
            return 'bi-dribbble';
        case 'basketball':
            return 'bi-basketball';
        case 'tennis':
            return 'bi-circle';
        case 'swimming':
            return 'bi-water';
        case 'volleyball':
            return 'bi-circle-fill';
        case 'badminton':
            return 'bi-square';
        default:
            return 'bi-dribbble';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Debounce function for search input
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Initialize Google Maps
function initializeGoogleMaps() {
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    
    // Default map center (can be anywhere initially)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
    
    // Create map
    map = new google.maps.Map(mapContainer, {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });
    
    // Create marker
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true
    });
    
    // Initialize Places Autocomplete
    autocomplete = new google.maps.places.Autocomplete(locationInput, {
        types: ['geocode']
    });
    
    // Bias autocomplete results to current map location
    autocomplete.bindTo('bounds', map);
    
    // Listen for place selection
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
            // User entered the name of a place that was not suggested
            return;
        }
        
        // Update map with selected place
        updateMapWithPlace(place);
    });
    
    // Update marker position when dragged
    google.maps.event.addListener(marker, 'dragend', function() {
        const position = marker.getPosition();
        map.setCenter(position);
        
        // Get address from coordinates (reverse geocoding)
        geocoder.geocode({ location: position }, function(results, status) {
            if (status === 'OK' && results[0]) {
                locationInput.value = results[0].formatted_address;
            }
        });
    });
}

// Update map with place from autocomplete
function updateMapWithPlace(place) {
    // Set map center to place
    map.setCenter(place.geometry.location);
    marker.setPosition(place.geometry.location);
    
    // Adjust zoom level based on place geometry
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setZoom(17);
    }
}

// Update map location based on address string
function updateMapLocation(address) {
    if (!address) return;
    
    geocoder.geocode({ address: address }, function(results, status) {
        if (status === 'OK' && results[0]) {
            map.setCenter(results[0].geometry.location);
            marker.setPosition(results[0].geometry.location);
            map.setZoom(15);
        }
    });
}

// Window click event to close modal when clicking outside
window.onclick = function(event) {
    if (event.target === editVenueModal) {
        closeModal(editVenueModal);
    }
    if (event.target === confirmationModal) {
        closeModal(confirmationModal);
    }
};