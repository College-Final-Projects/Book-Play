// Database integration for users
let currentPlayers = [];
let allPlayers = []; // Will be populated from database
let userAvailability = {};
let isAvailableToPlay = true;
let searchTimeout;
let friendsList = []; // Store friends list
let userLocation = null; // Store current user's location

const searchInput = document.getElementById('searchInput');
const sortByMeBtn = document.getElementById('sortByMeBtn');
const availableToggle = document.getElementById('availableToggle');
const selectAllBtn = document.getElementById('selectAllBtn');
const playersGrid = document.getElementById('playersGrid');
const playerModal = document.getElementById('playerModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// Get user's current location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            showLocationError('Geolocation is not supported by this browser');
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }
        
        // Show a more detailed permission request
        showLocationPermissionRequest();
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                userLocation = location;
                console.log('📍 User location obtained:', location);
                
                // Hide the permission request and show success message
                hideLocationNotice();
                showLocationSuccess();
                
                resolve(location);
            },
            (error) => {
                console.warn('⚠️ Geolocation error:', error.message);
                
                // Show specific error message based on error type
                let errorMessage = 'Unable to get your location';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please allow location access in your browser settings to see distances to other players.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please check your device settings.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                }
                showLocationError(errorMessage);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

// Show location permission request
function showLocationPermissionRequest() {
    const existingNotice = document.querySelector('.location-notice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    const locationNotice = document.createElement('div');
    locationNotice.className = 'location-notice permission-request';
    locationNotice.innerHTML = `
        <div class="location-notice-content">
            <div class="location-icon">📍</div>
            <div class="location-text">
                <h4>Location Access Required</h4>
                <p>Allow location access to see distances to other players and find nearby sports partners.</p>
                <p class="location-benefits">• See how far other players are from you</p>
                <p class="location-benefits">• Find the closest players to play with</p>
                <p class="location-benefits">• Get better matchmaking results</p>
            </div>
            <div class="location-actions">
                <button class="btn-primary" onclick="retryLocation()">Allow Location</button>
                <button class="btn-secondary" onclick="hideLocationNotice()">Not Now</button>
            </div>
        </div>
    `;
    document.body.appendChild(locationNotice);
}

// Show location success message
function showLocationSuccess() {
    const locationNotice = document.createElement('div');
    locationNotice.className = 'location-notice success';
    locationNotice.innerHTML = `
        <div class="location-notice-content">
            <div class="location-icon">✅</div>
            <div class="location-text">
                <h4>Location Access Granted</h4>
                <p>You can now see distances to other players!</p>
            </div>
            <button class="btn-secondary" onclick="hideLocationNotice()">Got it</button>
        </div>
    `;
    document.body.appendChild(locationNotice);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideLocationNotice();
    }, 3000);
}

// Show location error message
function showLocationError(message) {
    const locationNotice = document.createElement('div');
    locationNotice.className = 'location-notice error';
    locationNotice.innerHTML = `
        <div class="location-notice-content">
            <div class="location-icon">⚠️</div>
            <div class="location-text">
                <h4>Location Access Issue</h4>
                <p>${message}</p>
            </div>
            <div class="location-actions">
                <button class="btn-primary" onclick="retryLocation()">Try Again</button>
                <button class="btn-secondary" onclick="hideLocationNotice()">Dismiss</button>
            </div>
        </div>
    `;
    document.body.appendChild(locationNotice);
}

// Hide location notice
function hideLocationNotice() {
    const notices = document.querySelectorAll('.location-notice');
    notices.forEach(notice => {
        notice.remove();
    });
}

// Retry location request
function retryLocation() {
    hideLocationNotice();
    getUserLocation().catch(error => {
        console.warn('⚠️ Retry failed:', error.message);
    });
}

// Save user location to database
async function saveUserLocation(latitude, longitude) {
    try {
        const formData = new FormData();
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);
        
        const response = await fetch('save_user_location.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Location saved to database');
        } else {
            console.warn('⚠️ Failed to save location:', data.message);
        }
    } catch (error) {
        console.error('❌ Error saving location:', error);
    }
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// Format distance for display
function formatDistance(distance) {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}km away`;
    } else {
        return `${Math.round(distance)}km away`;
    }
}

// Check if two users are friends
async function checkFriendStatus(targetUsername) {
    try {
        const formData = new FormData();
        formData.append('target_username', targetUsername);
        
        const response = await fetch('check_friend_status.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            return data.is_friend;
        } else {
            console.warn('⚠️ Error checking friend status:', data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking friend status:', error);
        return false;
    }
}

// Fetch users from database
async function fetchUsers() {
    // Show loading state
    if (playersGrid) {
        playersGrid.innerHTML = '<div class="loading"><p>Loading players...</p></div>';
    }
    
    try {
        // First, get user's location
        try {
            await getUserLocation();
            // Save location to database
            await saveUserLocation(userLocation.latitude, userLocation.longitude);
        } catch (error) {
            console.warn('⚠️ Could not get user location:', error.message);
        }
        
        // Fetch users from database
        const response = await fetch('fetch_users.php');
        const data = await response.json();
        
        if (data.success) {
            allPlayers = data.users;
            
            // Calculate distances if user location is available
            if (userLocation) {
                allPlayers.forEach(player => {
                    if (player.latitude && player.longitude) {
                        const distance = calculateDistance(
                            userLocation.latitude, 
                            userLocation.longitude,
                            player.latitude, 
                            player.longitude
                        );
                        player.distance = formatDistance(distance);
                    } else {
                        player.distance = 'Location not set';
                    }
                });
                
                // Sort by distance (closest first)
                allPlayers.sort((a, b) => {
                    if (a.distance === 'Location not set' && b.distance === 'Location not set') return 0;
                    if (a.distance === 'Location not set') return 1;
                    if (b.distance === 'Location not set') return -1;
                    
                    const distA = parseFloat(a.distance);
                    const distB = parseFloat(b.distance);
                    return distA - distB;
                });
            }
            
            // Check friend status for each player
            for (let player of allPlayers) {
                player.isFriend = await checkFriendStatus(player.username);
            }
            
            currentPlayers = [...allPlayers];
            renderPlayers();
            console.log('✅ Users fetched successfully:', allPlayers.length, 'users');
        } else {
            console.error('❌ Error fetching users:', data.message);
            // Fallback to empty array
            allPlayers = [];
            currentPlayers = [];
            renderPlayers();
        }
    } catch (error) {
        console.error('❌ Network error fetching users:', error);
        // Fallback to empty array
        allPlayers = [];
        currentPlayers = [];
        renderPlayers();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAvailability();
    setupEventListeners();
    
    // Show enhanced location permission request
    if (navigator.geolocation) {
        showLocationPermissionRequest();
    }
    
    fetchUsers(); // Fetch users from database
});

function initializeAvailability() {
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0,3));
        const container = document.getElementById(`slots-${day}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                const dayCard = document.querySelector(`[data-day="${day}"]`);
                if (checkbox.checked) {
                    dayCard.classList.add('active');
                    showAddButton(day);
                } else {
                    dayCard.classList.remove('active');
                    container.innerHTML = '';
                    delete userAvailability[day];
                }
            });
        }
    });
}

function showAddButton(day) {
    const container = document.getElementById(`slots-${day}`);
    if (!container.querySelector('.add-slot-btn')) {
        const btn = document.createElement('button');
        btn.className = 'add-slot-btn';
        btn.textContent = '+ Add Time Slot';
        btn.onclick = () => addTimeSlot(day);
        container.appendChild(btn);
    }
}

function addTimeSlot(day) {
    const container = document.getElementById(`slots-${day}`);
    if (container.querySelectorAll('.time-slot').length >= 3) return;
    
    const div = document.createElement('div');
    div.className = 'time-slot';
    div.innerHTML = '<input type="text" class="start-time flatpickr-input" placeholder="Start time"><span>–</span><input type="text" class="end-time flatpickr-input" placeholder="End time"><button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>';
    
    const addBtn = container.querySelector('.add-slot-btn');
    if (addBtn) addBtn.remove();
    container.appendChild(div);
    
    // Initialize Flatpickr for the new time inputs
    const startTimeInput = div.querySelector('.start-time');
    const endTimeInput = div.querySelector('.end-time');
    
    const startTimePicker = flatpickr(startTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        placeholder: "Start time",
        onChange: () => updateUserAvailability(day)
    });
    
    const endTimePicker = flatpickr(endTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        placeholder: "End time",
        onChange: () => updateUserAvailability(day)
    });
    
    if (container.querySelectorAll('.time-slot').length < 3) showAddButton(day);
    updateUserAvailability(day);
}

function deleteTimeSlot(btn) {
    const container = btn.parentElement.parentElement;
    const day = container.id.replace('slots-','');
    btn.parentElement.remove();
    if (container.querySelectorAll('.time-slot').length < 3) showAddButton(day);
    updateUserAvailability(day);
}

function updateUserAvailability(day) {
    const container = document.getElementById(`slots-${day}`);
    const slots = container.querySelectorAll('.time-slot');
    if (!slots.length) return delete userAvailability[day];
    userAvailability[day] = [];
    slots.forEach(slot => {
        const start = slot.querySelector('.start-time').value;
        const end = slot.querySelector('.end-time').value;
        if (start && end) userAvailability[day].push(`${start}-${end}`);
    });
}

// Search functionality
function searchPlayers(searchTerm) {
    if (!searchTerm.trim()) {
        // If search is empty, show all players
        currentPlayers = [...allPlayers];
    } else {
        // Filter players by name (case-insensitive)
        currentPlayers = allPlayers.filter(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    renderPlayers();
}

function renderPlayers() {
    if (!playersGrid) return;
    
    if (currentPlayers.length === 0) {
        playersGrid.innerHTML = '<div class="no-results"><p>No players found matching your search.</p></div>';
        return;
    }
    
    playersGrid.innerHTML = currentPlayers.map(player => {
        const isFriend = player.isFriend || false;
        return `
        <div class="player-card" onclick="openPlayerModal('${player.first_name} ${player.last_name}', '${player.email}', '${player.favorite_sports || 'Not specified'}', '${player.age || 'Not specified'}', '${player.gender || 'Not specified'}', '${player.phone || 'Not specified'}', '${player.distance || 'Location not set'}', '${player.user_image || '../../../uploads/users/default.jpg'}')">
            <div class="player-image">
                <img src="${player.user_image || '../../../uploads/users/default.jpg'}" alt="${player.first_name} ${player.last_name}" onerror="this.src='../../../uploads/users/default.jpg'" />
            </div>
            <div class="player-details">
                <h4 class="player-name">${player.first_name} ${player.last_name}</h4>
                <p class="player-sport">Sport: ${player.favorite_sports || 'Not specified'}</p>
                <p class="player-location">${player.distance || 'Location not set'}</p>
                <div class="player-actions">
                    <button class="add-friend-btn ${isFriend ? 'already-friend' : ''}" 
                            onclick="event.stopPropagation(); ${isFriend ? 'void(0)' : `addFriend('${player.username}')`}" 
                            ${isFriend ? 'disabled' : ''}>
                        ${isFriend ? 'Already Friend' : 'Add Friend'}
                    </button>
                    <button class="connect-btn" onclick="event.stopPropagation()">Connect</button>
                </div>
            </div>
        </div>
    `;}).join('');
}

// Add Friend functionality
function addFriend(playerUsername) {
    // Send friend request to backend
    const formData = new FormData();
    formData.append('action', 'send_request');
    formData.append('friend_username', playerUsername);
    
    fetch('../MyFriends/friends_api.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            // Update button to show "Request Sent"
            updateAddFriendButton(playerUsername, 'Request Sent', 'request-sent');
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request. Please try again.');
    });
}

function updateAddFriendButton(playerUsername, status, className = '') {
    // Find the button for this player and update its text
    const buttons = document.querySelectorAll('.add-friend-btn');
    buttons.forEach(button => {
        if (button.getAttribute('onclick') && button.getAttribute('onclick').includes(playerUsername)) {
            button.textContent = status;
            button.disabled = true;
            
            // Remove existing classes
            button.classList.remove('already-friend', 'request-sent');
            
            // Add appropriate class
            if (className) {
                button.classList.add(className);
            }
            
            // Update background color based on status
            if (status === 'Already Friend') {
                button.style.backgroundColor = '#10b981';
            } else if (status === 'Request Sent') {
                button.style.backgroundColor = '#6b7280';
            }
        }
    });
}

function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            // Add small delay for better performance
            searchTimeout = setTimeout(() => {
                searchPlayers(e.target.value);
            }, 300);
        });
    }
    
    if (sortByMeBtn) sortByMeBtn.addEventListener('click', () => {});
    if (selectAllBtn) selectAllBtn.addEventListener('click', handleSelectAll);
    if (availableToggle) availableToggle.addEventListener('change', () => {
        isAvailableToPlay = availableToggle.checked;
    });
    if (closeModal) closeModal.addEventListener('click', () => playerModal.style.display = 'none');
}

function handleSelectAll() {
    const allChecked = days.every(day => {
        const checkbox = document.getElementById(day.substring(0,3));
        return checkbox && checkbox.checked;
    });
    
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0,3));
        const container = document.getElementById(`slots-${day}`);
        const card = document.querySelector(`[data-day="${day}"]`);
        
        if (checkbox && container && card) {
            if (!allChecked) {
                checkbox.checked = true;
                card.classList.add('active');
                showAddButton(day);
            } else {
                checkbox.checked = false;
                card.classList.remove('active');
                container.innerHTML = '';
                delete userAvailability[day];
            }
        }
    });
    
    if (selectAllBtn) {
        selectAllBtn.textContent = allChecked ? 'Select Everyday' : 'Clear All';
    }
}

// Modal Functions for Player Profile
function openPlayerModal(username, email, sport, age, gender, phone, location, image) {
    const modalElements = {
        name: document.getElementById('modalPlayerName'),
        username: document.getElementById('modalUsername'),
        email: document.getElementById('modalEmail'),
        sport: document.getElementById('modalSport'),
        age: document.getElementById('modalAge'),
        gender: document.getElementById('modalGender'),
        phone: document.getElementById('modalPhone'),
        location: document.getElementById('modalLocation'),
        image: document.getElementById('modalPlayerImage')
    };
    
    // Update modal content if elements exist
    if (modalElements.name) modalElements.name.textContent = username;
    if (modalElements.username) modalElements.username.textContent = username;
    if (modalElements.email) modalElements.email.textContent = email;
    if (modalElements.sport) modalElements.sport.textContent = sport;
    if (modalElements.age) modalElements.age.textContent = age;
    if (modalElements.gender) modalElements.gender.textContent = gender;
    if (modalElements.phone) modalElements.phone.textContent = phone;
    if (modalElements.location) modalElements.location.textContent = location;
    if (modalElements.image) modalElements.image.src = image;
    
    if (playerModal) {
        playerModal.style.display = 'block';
    }
}

function closePlayerModal() {
    if (playerModal) {
        playerModal.style.display = 'none';
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (playerModal && event.target == playerModal) {
        closePlayerModal();
    }
}