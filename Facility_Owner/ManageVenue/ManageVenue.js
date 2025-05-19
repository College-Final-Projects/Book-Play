
// Global variables for the map
let map;
let marker;
let facilities = []; // Global variable to store facilities

document.addEventListener('DOMContentLoaded', function() {
     // Find and remove the "Image upload functionality coming soon!" notice
    const smallNotice = document.querySelector('#venueImages + small');
    if (smallNotice) {
        smallNotice.remove();
    }
    
    // Load facilities when the page loads
    loadFacilities();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterVenues);
    }
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortVenues);
    }
    
    // Set up the modal
    setupModal();
    
    // Enhance modal scrolling
    enhanceModalScrolling();
});

// Load facilities using Fetch API
function loadFacilities() {
    fetch('get_facilities.php')
        .then(response => response.json())
        .then(data => {
            facilities = data; // Save facilities in the global variable
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

// Display facilities
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
        
        // Default image if none provided
        const imageUrl = facility.image_url || '/api/placeholder/400/320';
        
        // Determine availability status
        const isAvailable = facility.is_available == 1;
        const statusClass = isAvailable ? 'status-available' : 'status-unavailable';
        const statusText = isAvailable ? 'Available' : 'Unavailable';
        
        // Create HTML for the venue card
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
    
    // Set up edit buttons after displaying venues
    setupEditButtons();
}

// Filter venues
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

// Sort venues
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

function toggleAvailability(checkbox) {
    const facilityId = checkbox.dataset.id;
    const newStatus = checkbox.checked ? 1 : 0;
    
    // Find the current venue card
    const venueCard = checkbox.closest('.venue-card');
    if (!venueCard) return;
    
    // Find the status element to update
    const statusElement = venueCard.querySelector('.venue-status');
    if (statusElement) {
        // Update text and CSS class
        if (newStatus === 1) {
            statusElement.textContent = 'Available';
            statusElement.classList.remove('status-unavailable');
            statusElement.classList.add('status-available');
        } else {
            statusElement.textContent = 'Unavailable';
            statusElement.classList.remove('status-available');
            statusElement.classList.add('status-unavailable');
        }
    }

    // Send update request to server
    fetch('update_availability.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `toggle_availability=1&facility_id=${facilityId}&is_available=${newStatus}`
    })
    .then(res => res.json())
    .then(data => {
        console.log("Updated successfully:", data);
        // We can skip reloading facilities here since we already updated the UI
    })
    .catch(err => {
        console.error("Error updating availability:", err);
        // In case of error, revert the toggle to previous state
        checkbox.checked = !checkbox.checked;
        // And revert the visual status as well
        if (statusElement) {
            if (checkbox.checked) {
                statusElement.textContent = 'Available';
                statusElement.classList.remove('status-unavailable');
                statusElement.classList.add('status-available');
            } else {
                statusElement.textContent = 'Unavailable';
                statusElement.classList.remove('status-available');
                statusElement.classList.add('status-unavailable');
            }
        }
    });
}

// Select all edit buttons after venues are displayed
function setupEditButtons() {
    const editButtons = document.querySelectorAll('.action-btn.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const facilityId = this.dataset.id;
            openEditModal(facilityId);
        });
    });
}

// Open edit modal and load facility data
function openEditModal(facilityId) {
    // Find the facility data from our global facilities array
    const facility = facilities.find(f => f.facilities_id == facilityId);
    if (!facility) {
        console.error('Facility not found');
        return;
    }

    // Get the modal elements
    const modal = document.getElementById('venueModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = modal.querySelector('form');
    
    // Set modal title to Edit mode
    modalTitle.textContent = 'Edit Venue';
    
    // Set hidden facility ID
    document.getElementById('facilityId').value = facilityId;
    
    // Fill form fields with facility data
    document.getElementById('placeName').value = facility.place_name || '';
    document.getElementById('description').value = facility.description || '';
    document.getElementById('price').value = facility.price || '';
    document.getElementById('isAvailable').checked = facility.is_available == 1;
    
    // Set location if available
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = facility.location || '';
    }
    
    // Set sport type if available
    const sportTypeSelect = document.getElementById('sportType');
    if (sportTypeSelect && facility.SportCategory) {
        // Find option with matching text and select it
        Array.from(sportTypeSelect.options).forEach(option => {
            if (option.text === facility.SportCategory) {
                sportTypeSelect.value = option.value;
            }
        });
    }
    
    // Display image previews if available
    if (facility.image_url) {
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
            
            // If image_url is a comma-separated list, split it
            const images = facility.image_url.split(',');
            
            images.forEach(img => {
                if (img.trim()) {
                    const imgElement = document.createElement('img');
                    imgElement.src = img.trim();
                    imgElement.alt = 'Venue Image';
                    imagePreview.appendChild(imgElement);
                }
            });
        }
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Reset scroll position to top
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Set the form submission handler
    form.onsubmit = function(e) {
        e.preventDefault();
        saveVenueChanges(form);
    };
}

// Save edited venue data
function saveVenueChanges(form) {
    // Create FormData object to easily get all form fields
    const formData = new FormData(form);
    
    // Add edit_facility flag
    formData.append('edit_facility', '1');
    
    // Handle checkbox state for is_available (not automatically included in FormData if unchecked)
    if (!formData.has('is_available')) {
        formData.append('is_available', '0');
    }
    
    // Get the file input element for venue images
    const fileInput = document.getElementById('venueImages');
    
    // Check if file input exists and has files selected
    if (fileInput && fileInput.files.length > 0) {
        // Clear any existing files in the formData with the same field name
        if (formData.has('venueImages')) {
            formData.delete('venueImages');
        }
        
        // Calculate how many files to upload (maximum 3)
        const maxFiles = Math.min(fileInput.files.length, 3);
        
        // Add each file to the form data with array notation for PHP
        for (let i = 0; i < maxFiles; i++) {
            formData.append('venueImages[]', fileInput.files[i]);
        }
    }
    
    // Send data to the server - use update_availability.php which handles both editing and toggling
    fetch('update_availability.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close the modal
            const modal = document.getElementById('venueModal');
            modal.style.display = 'none';
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Reload facilities to reflect changes
            loadFacilities();
            
            // Show success message if needed
            alert('Venue updated successfully!');
        } else {
            alert('Error: ' + (data.message || 'Failed to update venue'));
        }
    })
    .catch(error => {
        console.error('Error saving changes:', error);
        alert('An error occurred while saving changes. Please try again.');
    });
}

// Function to enhance modal scrolling
function enhanceModalScrolling() {
    // This function makes the modal scrollable and manages body scrolling
    const modal = document.getElementById('venueModal');
    if (!modal) return;
    
    // Add overflow properties to modal content if they don't exist
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxHeight = modalContent.style.maxHeight || '85vh';
        modalContent.style.overflowY = modalContent.style.overflowY || 'auto';
    }
}

/**
 * Function to handle adding a new venue with image upload support
 * This function sends the form data to the server using fetch API
 * @param {HTMLFormElement} form - The form element containing the venue data
 */
function addNewVenue(form) {
    // Create a new FormData object from the form
    const formData = new FormData(form);
    
    // Add the add_facility flag to indicate this is a new facility
    formData.append('add_facility', '1');
    
    // Handle checkbox state for is_available (checkboxes aren't included in FormData when unchecked)
    if (!formData.has('is_available')) {
        // Add is_available as 0 (false) if the checkbox wasn't checked
        formData.append('is_available', '0');
    }
    
    // Get the file input element for venue images
    const fileInput = document.getElementById('venueImages');
    
    // Check if file input exists and has files selected
    if (fileInput && fileInput.files.length > 0) {
        // Clear any existing files in the formData with the same field name
        if (formData.has('venueImages')) {
            formData.delete('venueImages');
        }
        
        // Calculate how many files to upload (maximum 3)
        const maxFiles = Math.min(fileInput.files.length, 3);
        
        // Add each file to the form data with array notation for PHP
        for (let i = 0; i < maxFiles; i++) {
            formData.append('venueImages[]', fileInput.files[i]);
        }
    }
    
    // Send data to server using the fetch API
    fetch('add_facility.php', {
        method: 'POST',        // Use POST method
        body: formData         // Send the form data
    })
    .then(response => response.json())  // Parse the JSON response
    .then(data => {
        // Check if the operation was successful
        if (data.success) {
            // Get the modal element
            const modal = document.getElementById('venueModal');
            
            // Hide the modal
            modal.style.display = 'none';
            
            // Restore body scrolling (which was disabled when modal was shown)
            document.body.style.overflow = '';
            
            // Show a success message to the user
            alert(data.message || 'New venue suggested successfully! An admin will review it.');
            
            // Reload facilities (note: new suggestions won't appear until approved by admin)
            loadFacilities();
        } else {
            // If operation failed, show error message
            alert('Error: ' + (data.message || 'Failed to add venue'));
        }
    })
    .catch(error => {
        // Log any errors to console for debugging
        console.error('Error adding new venue:', error);
        
        // Show a user-friendly error message
        alert('An error occurred while adding the venue. Please try again.');
    });
}

/**
 * Function to handle image preview functionality
 * Shows image previews when files are selected
 */
function setupImagePreview() {
    // Get the file input element
    const imageInput = document.getElementById('venueImages');
    
    // Get the container for image previews
    const imagePreview = document.getElementById('imagePreview');
    
    // If either element doesn't exist, exit the function
    if (!imageInput || !imagePreview) return;
    
    // Add an event listener for when files are selected
    imageInput.addEventListener('change', function() {
        // Clear any existing previews
        imagePreview.innerHTML = '';
        
        // Calculate how many files to preview (maximum 3)
        const maxFiles = Math.min(this.files.length, 3);
        
        // Loop through each selected file
        for (let i = 0; i < maxFiles; i++) {
            // Get the current file
            const file = this.files[i];
            
            // Only process image files (skip other file types)
            if (!file.type.startsWith('image/')) continue;
            
            // Create a new FileReader to read the image file
            const reader = new FileReader();
            
            // Define what happens when the file is loaded
            reader.onload = function(e) {
                // Create an image element
                const img = document.createElement('img');
                
                // Set the image source to the loaded file data
                img.src = e.target.result;
                
                // Set alt text for accessibility
                img.alt = 'Image Preview';
                
                // Add the image to the preview container
                imagePreview.appendChild(img);
            };
            
            // Start reading the file as a data URL
            reader.readAsDataURL(file);
        }
        
        // If user selected more than 3 files, show a warning
        if (this.files.length > 3) {
            // Create a paragraph element for the warning
            const warning = document.createElement('p');
            
            // Set the warning text
            warning.textContent = 'Note: Only the first 3 images will be uploaded.';
            
            // Style the warning
            warning.style.color = '#e74c3c';
            warning.style.fontSize = '12px';
            warning.style.marginTop = '5px';
            
            // Add the warning to the preview container
            imagePreview.appendChild(warning);
        }
    });
}

/**
 * Function to set up the modal and its functionality
 * Should be called when the page loads
 */
function setupModal() {
    // Get the modal element
    const modal = document.getElementById('venueModal');
    
    // Get the close button element
    const closeBtn = document.getElementById('closeModal');
    
    // Get the cancel button element
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    // Setup sport type options if not already populated
    const sportTypeSelect = document.getElementById('sportType');
    
    // Check if the select element exists and has fewer than 2 options (including the default)
    if (sportTypeSelect && sportTypeSelect.options.length <= 1) {
        // Define common sport options
        const sportOptions = ['Football', 'Basketball', 'Tennis', 'Swimming', 'Volleyball', 'Badminton', 'Table Tennis', 'Other'];
        
        // Loop through each sport and add it as an option
        sportOptions.forEach(sport => {
            // Create a new option element
            const option = document.createElement('option');
            
            // Set the option's value to lowercase sport name
            option.value = sport.toLowerCase();
            
            // Set the option's displayed text
            option.textContent = sport;
            
            // Add the option to the select element
            sportTypeSelect.appendChild(option);
        });
    }
    
    // Define a function to close the modal
    const closeModal = () => {
        // Hide the modal
        modal.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = '';
    };
    
    // Add event listener to close button
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // Add event listener to cancel button
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Close modal if user clicks outside of it (on the overlay)
    window.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Set up the "Add New Venue" button
    const addBtn = document.querySelector('.add-venue-btn');
    
    // Check if the button exists
    if (addBtn) {
        // Add click event listener
        addBtn.addEventListener('click', () => {
            // Get the form element
            const form = modal.querySelector('form');
            
            // Reset the form to clear all fields
            form.reset();
            
            // Reset the hidden facility ID field
            document.getElementById('facilityId').value = '';
            
            // Clear image previews
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // Set modal title to "Add New Venue"
            document.getElementById('modalTitle').textContent = 'Add New Venue';
            
            // Display the modal
            modal.style.display = 'flex';
            
            // Reset scroll position to top (after a short delay)
            setTimeout(() => {
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.scrollTop = 0;
                }
            }, 10);
            
            // Prevent body scrolling while modal is open
            document.body.style.overflow = 'hidden';
            
            // Set form submission handler for adding a new venue
            form.onsubmit = function(e) {
                // Prevent the default form submission
                e.preventDefault();
                
                // Use our custom addNewVenue function
                addNewVenue(form);
            };
        });
    }
    
    // Setup image preview functionality
    setupImagePreview();
}