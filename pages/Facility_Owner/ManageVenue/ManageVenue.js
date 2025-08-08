// Global variables
let venuesData = [];
let sportsData = [];
let map;
let marker;
let geocoder;
let currentEditingId = null;

// DOM elements - will be initialized after DOM is ready
let venueGrid;
let venueModal;
let addVenueBtn;
let closeModalBtn;
let cancelBtn;
let searchInput;
let sortSelect;
let sortBySportSelect;
let modalTitle;
let venueForm;
let imageInput;
let imagePreview;

// Initialize DOM elements
function initializeDOMElements() {
    venueGrid = document.getElementById('venueGrid');
    venueModal = document.getElementById('venueModal');
    addVenueBtn = document.querySelector('.add-venue-btn');
    closeModalBtn = document.getElementById('closeModal');
    cancelBtn = document.querySelector('.cancel-btn');
    searchInput = document.getElementById('searchInput');
    sortSelect = document.getElementById('sortSelect');
    sortBySportSelect = document.getElementById('sortbysport');
    modalTitle = document.getElementById('modalTitle');
    venueForm = document.querySelector('form');
    imageInput = document.getElementById('venueImages');
    imagePreview = document.getElementById('imagePreview');
}

async function initializeApp() {
    window.initializeApp = initializeApp;
    
    try {
        // Initialize DOM elements first
        initializeDOMElements();
        
        // Check if all required elements exist
        if (!venueModal || !addVenueBtn || !closeModalBtn || !cancelBtn) {
            console.error('Required modal elements not found');
            console.log('Missing elements:', {
                venueModal: !!venueModal,
                addVenueBtn: !!addVenueBtn,
                closeModalBtn: !!closeModalBtn,
                cancelBtn: !!cancelBtn
            });
            showMessage('Modal elements not found. Please refresh the page.', 'error');
            return;
        }
        
        console.log('DOM elements initialized successfully');
        
        await loadSports();
        await loadVenues();
        initializeMap();
        setupEventListeners();
        // Populate sports filter after venues are loaded
        populateSportsFilter();
        
        console.log('App initialization completed successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}
async function initMap() {
  await google.maps.importLibrary("places");
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
  const container = document.getElementById("autocompleteElement");
  container.replaceWith(placeAutocomplete);

  const selectedLatInput = document.getElementById("latitude");
  const selectedLngInput = document.getElementById("longitude");

  placeAutocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });

    const location = place.location;
    const lat = location.lat;
    const lng = location.lng;

    if (lat && lng) {
      const latLng = { lat, lng };

      map.setCenter(latLng);
      marker.position = latLng;

      selectedLatInput.value = lat;
      selectedLngInput.value = lng;
    }
  });
}

// Load sports data from server
async function loadSports() {
    try {
        console.log('Loading sports data...');
        const response = await fetch('fetch_venues.php?action=get_sports');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Sports API response:', text);
        
        try {
            sportsData = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse sports JSON:', text);
            throw new Error('Invalid JSON response from sports API');
        }
        
        console.log(`Loaded ${sportsData.length} sports:`, sportsData);
        populateSportsDropdown();
    } catch (error) {
        console.error('Error loading sports:', error);
        showMessage('Error loading sports data: ' + error.message, 'error');
        sportsData = []; // Fallback to empty array
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
    
    if (!sportSelect) {
        console.error('Sport select element not found');
        return;
    }
    
    // Show loading state
    sportSelect.innerHTML = '<option value="">Loading sports...</option>';
    sportSelect.disabled = true;
    
    if (sportsData && sportsData.length > 0) {
        // Clear loading state
        sportSelect.innerHTML = '<option value="">Select Sport Type</option>';
        sportSelect.disabled = false;
        
        sportsData.forEach(sport => {
            const option = document.createElement('option');
            option.value = sport.sport_name;
            option.textContent = sport.sport_name;
            sportSelect.appendChild(option);
        });
        
        console.log(`Loaded ${sportsData.length} sports for selection`);
    } else {
        sportSelect.innerHTML = '<option value="">No sports available</option>';
        sportSelect.disabled = true;
    }
}

// Populate sports filter dropdown - only show sports from user's facilities
function populateSportsFilter() {
    if (!sortBySportSelect) return;
    
    sortBySportSelect.innerHTML = '<option value="">All Sports</option>';
    
    // Get unique sports from user's facilities
    const userSports = [...new Set(venuesData.map(venue => venue.SportCategory))];
    
    userSports.forEach(sportName => {
        if (sportName) {
            const option = document.createElement('option');
            option.value = sportName;
            option.textContent = sportName;
            sortBySportSelect.appendChild(option);
        }
    });
    
    console.log(`Loaded ${userSports.length} sports from user facilities for filtering`);
}

// Initialize Google Maps with enhanced location search
function initializeMap() {
    // Check if Google Maps is available
    if (typeof google === 'undefined' || !google.maps) {
        console.log('Google Maps not available, skipping map initialization');
        return;
    }
    
    const defaultLocation = { lat: 32.0853, lng: 34.7818 };

    try {
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

        // Initialize location search functionality
        initializeLocationSearch();

        map.addListener('click', function(event) {
            updateMarkerPosition(event.latLng);
        });
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
    }
}

// Initialize location search with Google Places API
function initializeLocationSearch() {
    const locationInput = document.getElementById('locationInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!locationInput || !searchResults) return;
    
    let searchTimeout;
    let placesService;
    
    // Initialize Places service
    if (map) {
        placesService = new google.maps.places.PlacesService(map);
    }
    
    // Handle input changes
    locationInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            hideSearchResults();
            return;
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPlaces(query);
        }, 300);
    });
    
    // Handle keyboard navigation
    locationInput.addEventListener('keydown', function(e) {
        handleSearchKeyboard(e);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!locationInput.contains(e.target) && !searchResults.contains(e.target)) {
            hideSearchResults();
        }
    });
    
    function searchPlaces(query) {
        if (!placesService) return;
        
        showSearchLoading();
        
        const request = {
            query: query,
            fields: ['place_id', 'name', 'formatted_address', 'geometry']
        };
        
        placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                displaySearchResults(results.slice(0, 5)); // Show max 5 results
            } else {
                showNoResults();
            }
        });
    }
    
    function displaySearchResults(places) {
        searchResults.innerHTML = '';
        
        places.forEach((place, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.index = index;
            
            resultItem.innerHTML = `
                <div class="search-result-icon">📍</div>
                <div class="search-result-text">
                    <div class="search-result-name">${place.name}</div>
                    <div class="search-result-address">${place.formatted_address}</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                selectPlace(place);
            });
            
            searchResults.appendChild(resultItem);
        });
        
        showSearchResults();
    }
    
    function selectPlace(place) {
        locationInput.value = place.formatted_address;
        
        if (place.geometry && place.geometry.location) {
            const location = place.geometry.location;
            map.setCenter(location);
            map.setZoom(16);
            marker.position = location;
            updateCoordinates(location.lat(), location.lng());
        }
        
        hideSearchResults();
    }
    
    function showSearchLoading() {
        searchResults.innerHTML = '<div class="search-loading">Searching locations...</div>';
        showSearchResults();
    }
    
    function showNoResults() {
        searchResults.innerHTML = '<div class="search-loading">No locations found</div>';
        showSearchResults();
    }
    
    function showSearchResults() {
        searchResults.classList.add('show');
    }
    
    function hideSearchResults() {
        searchResults.classList.remove('show');
    }
    
    function handleSearchKeyboard(e) {
        const items = searchResults.querySelectorAll('.search-result-item');
        const selected = searchResults.querySelector('.search-result-item.selected');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selected) {
                selected.classList.remove('selected');
                const next = selected.nextElementSibling || items[0];
                next.classList.add('selected');
            } else if (items.length > 0) {
                items[0].classList.add('selected');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selected) {
                selected.classList.remove('selected');
                const prev = selected.previousElementSibling || items[items.length - 1];
                prev.classList.add('selected');
            } else if (items.length > 0) {
                items[items.length - 1].classList.add('selected');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selected) {
                selected.click();
            }
        } else if (e.key === 'Escape') {
            hideSearchResults();
        }
    }
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
        // Update sports filter even if no venues
        populateSportsFilter();
        return;
    }
    
    venueGrid.innerHTML = venues.map(venue => createVenueCard(venue)).join('');
    
    // Add event listeners to toggle switches and action buttons
    setupVenueCardEventListeners();
    
    // Update sports filter when venues are displayed
    populateSportsFilter();
}

// Create venue card HTML
function createVenueCard(venue) {
    const images = venue.image_url ? venue.image_url.split(',') : [];
    const firstImage = images.length > 0 ? images[0] : 'placeholder.jpg';
    const isAvailable = venue.is_available == 1;
    
    return `
        <div class="venue-card" data-venue-id="${venue.facilities_id}">
            <div class="venue-image">
                <img src="${firstImage}" alt="${venue.place_name}" onerror="this.src='../../../Images/default.jpg'">
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
                        <button class="action-btn view" onclick="viewVenueDetails(${venue.facilities_id})">👁️ View Details</button>
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
                    img.style.border = '1px solid #ddd';
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
    
    // Show modal with enhanced animation
    venueModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Add opening class for animation
    setTimeout(() => {
        venueModal.classList.add('modal-opening');
    }, 10);
    
    // Focus on first input for better UX and ensure sports are loaded
    setTimeout(() => {
        const firstInput = document.getElementById('placeName');
        if (firstInput) {
            firstInput.focus();
            firstInput.select(); // Select text if editing
        }
        
        // Ensure sports dropdown is populated
        if (sportsData && sportsData.length > 0) {
            populateSportsDropdown();
        }
    }, 300);
}

// Close modal
function closeModal() {
    // Add closing animation
    venueModal.classList.remove('modal-opening');
    venueModal.classList.add('modal-closing');
    
    setTimeout(() => {
        venueModal.style.display = 'none';
        venueModal.classList.remove('modal-closing');
        document.body.style.overflow = 'auto'; // Restore scrolling
        currentEditingId = null;
        
        // Reset form
        if (venueForm) {
            venueForm.reset();
        }
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
        
        // Re-enable sport select in case it was disabled
        const sportSelect = document.getElementById('sportType');
        if (sportSelect) {
            sportSelect.disabled = false;
        }
    }, 200);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Basic form validation
    const placeName = document.getElementById('placeName').value.trim();
    const sportType = document.getElementById('sportType').value;
    const price = document.getElementById('price').value;
    const location = document.getElementById('locationInput').value.trim();
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    // Validation checks
    if (!placeName) {
        showMessage('Please enter a venue name', 'error');
        document.getElementById('placeName').focus();
        return;
    }
    
    if (!sportType) {
        showMessage('Please select a sport type', 'error');
        document.getElementById('sportType').focus();
        return;
    }
    
    if (!price || price <= 0) {
        showMessage('Please enter a valid price', 'error');
        document.getElementById('price').focus();
        return;
    }
    
    if (!location) {
        showMessage('Please enter a location', 'error');
        document.getElementById('locationInput').focus();
        return;
    }
    
    if (!latitude || !longitude) {
        showMessage('Please select a location on the map', 'error');
        return;
    }
    
    const formData = new FormData(venueForm);
    
    // Determine if we're editing or adding
    if (currentEditingId) {
        formData.append('action', 'update_facility');
        formData.append('facility_id', currentEditingId);
    } else {
        formData.append('action', 'add_facility');
    }
    
    try {
        // Show loading state
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
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
    } finally {
        // Restore button state
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Handle image preview
function handleImagePreview(e) {
    const files = Array.from(e.target.files);
    imagePreview.innerHTML = '';
    
    // Limit to 3 images
    const limitedFiles = files.slice(0, 3);
    
    if (files.length === 0) {
        return;
    }
    
    let validFiles = 0;
    
    limitedFiles.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage(`Image ${index + 1} is too large. Maximum size is 5MB.`, 'warning');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '10px';
                img.style.border = '1px solid #ddd';
                img.style.margin = '5px';
                
                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '×';
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '-5px';
                removeBtn.style.right = '-5px';
                removeBtn.style.background = '#ef4444';
                removeBtn.style.color = 'white';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.fontSize = '12px';
                removeBtn.onclick = function() {
                    img.parentElement.remove();
                };
                
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.display = 'inline-block';
                container.appendChild(img);
                container.appendChild(removeBtn);
                
                imagePreview.appendChild(container);
                validFiles++;
            };
            reader.readAsDataURL(file);
        } else {
            showMessage(`File ${index + 1} is not an image.`, 'warning');
        }
    });
    
    if (files.length > 3) {
        showMessage('Only the first 3 images will be uploaded.', 'warning');
    }
    
    if (validFiles > 0) {
        showMessage(`${validFiles} image(s) selected successfully.`, 'success');
    }
}

// View venue details function
function viewVenueDetails(venueId) {
    // Redirect to player's VenueDetails.php with the facility ID
    window.location.href = `../../player/VenueDetails/VenueDetails.php?facility_id=${venueId}`;
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
    
    // Fallback initialization if Google Maps doesn't load
    setTimeout(() => {
        if (typeof google === 'undefined' || !google.maps) {
            console.log('Google Maps not loaded, initializing without map');
            initializeApp();
        }
    }, 3000);
});

// Also initialize when window loads
window.addEventListener('load', function() {
    if (typeof google === 'undefined' || !google.maps) {
        console.log('Google Maps not loaded on window load, initializing without map');
        initializeApp();
    }
});