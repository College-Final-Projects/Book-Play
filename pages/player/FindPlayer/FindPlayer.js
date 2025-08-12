// FindPlayer.js - Updated with Arabic requirements
let currentPlayers = [];
let allPlayers = []; // Store all players for regular search
let userAvailability = {}; // FORCE as object, not array
let isAvailableToPlay = true;
let searchTimeout;
let friendsList = [];
let hasUnsavedChanges = false;

// DOM elements
const searchInput = document.getElementById('searchInput');
const sortByMeBtn = document.getElementById('sortByMeBtn');
const availableToggle = document.getElementById('availableToggle');
const selectAllBtn = document.getElementById('selectAllBtn');
const saveAvailabilityBtn = document.getElementById('saveAvailabilityBtn');
const saveStatus = document.getElementById('saveStatus');
const playersGrid = document.getElementById('playersGrid');
const playerModal = document.getElementById('playerModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing FindPlayer...');
    
    // FORCE Initialize userAvailability as empty OBJECT (not array)
    userAvailability = {};
    console.log('Forced userAvailability to be object:', userAvailability);
    
    initializeAvailability();
    setupEventListeners();
    loadInitialData();
    
    setTimeout(() => {
        if (saveAvailabilityBtn) {
            saveAvailabilityBtn.disabled = false;
            console.log('Save button force-enabled after DOM load');
        }
    }, 1000);
});

async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        
        // Load user's availability
        await loadUserAvailability();
        
        // Load visibility status
        await loadVisibilityStatus();
        
        // Load all players for regular search
        await loadAllPlayers();
        
        // Initially show all players
        currentPlayers = [...allPlayers];
        renderPlayers();
        
        if (saveAvailabilityBtn) {
            saveAvailabilityBtn.disabled = false;
            console.log('Save button enabled on page load');
        }
        
        updateSaveButtonState();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

async function loadUserAvailability() {
    try {
        const response = await fetch('FindPlayerAPI.php?action=get_availability', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const availability = await response.json();
            console.log('Loaded availability from server:', availability);
            
            // FORCE userAvailability to be an object, never an array
            if (availability && typeof availability === 'object' && !Array.isArray(availability)) {
                userAvailability = availability;
            } else {
                console.log('Server returned invalid availability, using empty object');
                userAvailability = {}; // OBJECT, not array
            }
            
            displayUserAvailability();
        } else {
            console.error('Failed to load availability, using empty object');
            userAvailability = {}; // OBJECT, not array
        }
    } catch (error) {
        console.error('Error loading availability:', error);
        userAvailability = {}; // OBJECT, not array
    }
}

async function loadVisibilityStatus() {
    try {
        const response = await fetch('FindPlayerAPI.php?action=get_visibility_status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            isAvailableToPlay = data.is_available;
            availableToggle.checked = isAvailableToPlay;
        }
    } catch (error) {
        console.error('Error loading visibility status:', error);
    }
}

// Load ALL players for regular search (not filtered)
async function loadAllPlayers() {
    try {
        const response = await fetch('FindPlayerAPI.php?action=get_all_players', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            allPlayers = await response.json();
        }
    } catch (error) {
        console.error('Error loading all players:', error);
    }
}

function displayUserAvailability() {
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0, 3));
        const dayCard = document.querySelector(`[data-day="${day}"]`);
        
        if (userAvailability[day] && userAvailability[day].length > 0) {
            checkbox.checked = true;
            dayCard.classList.add('active');
            showTimeSlots(day, userAvailability[day]);
        } else if (userAvailability[day] && userAvailability[day].length === 0) {
            checkbox.checked = true;
            dayCard.classList.add('active');
            showAddButton(day);
        } else {
            checkbox.checked = false;
            dayCard.classList.remove('active');
        }
    });
}

function showTimeSlots(day, slots) {
    const container = document.getElementById(`slots-${day}`);
    container.innerHTML = '';
    
    slots.forEach(slot => {
        const div = document.createElement('div');
        div.className = 'time-slot';
        div.innerHTML = `
            <input type="time" class="start-time" value="${slot.start || ''}">
            <span>–</span>
            <input type="time" class="end-time" value="${slot.end || ''}">
            <button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>
        `;
        container.appendChild(div);
        
        const inputs = div.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (validateTimeSlot(div)) {
                    updateUserAvailability(day);
                }
            });
        });
    });
    
    if (slots.length < 3) {
        showAddButton(day);
    }
}

// Validate time slot to prevent invalid times (e.g., 3 PM to 1 PM)
function validateTimeSlot(timeSlotDiv) {
    const startInput = timeSlotDiv.querySelector('.start-time');
    const endInput = timeSlotDiv.querySelector('.end-time');
    
    if (startInput.value && endInput.value) {
        const startTime = startInput.value;
        const endTime = endInput.value;
        
        if (startTime >= endTime) {
            showNotification('❌ Start time must be before end time!', 'error');
            endInput.value = '';
            return false;
        }
    }
    return true;
}

function initializeAvailability() {
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0, 3));
        const container = document.getElementById(`slots-${day}`);
        
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                const dayCard = document.querySelector(`[data-day="${day}"]`);
                
                console.log(`Day ${day} checkbox changed to: ${checkbox.checked}`); // Debug log
                
                if (checkbox.checked) {
                    // Day is being selected
                    dayCard.classList.add('active');
                    
                    // Initialize the day in userAvailability as all-day available (empty array)
                    userAvailability[day] = [];
                    console.log(`Initialized ${day} as all-day available (empty array)`);
                    
                    showAddButton(day);
                    markAsUnsaved();
                } else {
                    // Day is being deselected
                    dayCard.classList.remove('active');
                    container.innerHTML = '';
                    
                    // Remove from availability object
                    delete userAvailability[day];
                    console.log(`Removed ${day} from availability`);
                    
                    markAsUnsaved();
                }
                
                console.log('Updated userAvailability:', userAvailability); // Debug log
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
    div.innerHTML = `
        <input type="time" class="start-time">
        <span>–</span>
        <input type="time" class="end-time">
        <button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>
    `;
    
    const addBtn = container.querySelector('.add-slot-btn');
    if (addBtn) addBtn.remove();
    container.appendChild(div);
    
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            console.log(`Time changed for ${day}, validating and updating...`); // Debug log
            if (validateTimeSlot(div)) {
                updateUserAvailability(day);
            }
        });
    });
    
    if (container.querySelectorAll('.time-slot').length < 3) {
        showAddButton(day);
    }
    
    // Initialize the day in userAvailability when adding first time slot
    if (!userAvailability[day]) {
        userAvailability[day] = [];
    }
    
    console.log(`Added time slot for ${day}, current userAvailability:`, userAvailability); // Debug log
    markAsUnsaved();
}

function deleteTimeSlot(btn) {
    const container = btn.parentElement.parentElement;
    const day = container.id.replace('slots-', '');
    btn.parentElement.remove();
    
    if (container.querySelectorAll('.time-slot').length < 3) {
        showAddButton(day);
    }
    
    updateUserAvailability(day);
}

function updateUserAvailability(day) {
    console.log('Updating availability for day:', day); // Debug log
    
    const container = document.getElementById(`slots-${day}`);
    const timeSlots = container.querySelectorAll('.time-slot');
    
    if (timeSlots.length === 0) {
        // User is available all day (no specific time slots)
        userAvailability[day] = [];
        console.log(`Set ${day} as all-day available (empty array)`);
    } else {
        // User has specific time slots
        userAvailability[day] = [];
        timeSlots.forEach(slot => {
            const startTime = slot.querySelector('.start-time').value;
            const endTime = slot.querySelector('.end-time').value;
            
            if (startTime && endTime) {
                userAvailability[day].push({
                    start: startTime,
                    end: endTime
                });
                console.log(`Added time slot for ${day}: ${startTime} - ${endTime}`);
            }
        });
    }
    
    console.log('Updated userAvailability:', userAvailability); // Debug log
    markAsUnsaved();
}

function markAsUnsaved() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
}

function updateSaveButtonState() {
    if (saveAvailabilityBtn) {
        console.log('Updating save button state, hasUnsavedChanges:', hasUnsavedChanges);
        if (hasUnsavedChanges) {
            saveAvailabilityBtn.classList.add('has-changes');
            saveAvailabilityBtn.disabled = false;
            console.log('Save button enabled (has changes)');
        } else {
            saveAvailabilityBtn.classList.remove('has-changes');
            saveAvailabilityBtn.disabled = false;
            console.log('Save button enabled (no changes)');
        }
    }
}

async function saveAvailabilityToDatabase() {
    console.log('saveAvailabilityToDatabase function called');
    
    // FORCE CHECK: Ensure userAvailability is an object
    if (Array.isArray(userAvailability)) {
        console.error('ERROR: userAvailability is an array, converting to object');
        userAvailability = {}; // Reset to empty object
    }
    
    try {
        console.log('Current userAvailability:', userAvailability);
        console.log('Type of userAvailability:', typeof userAvailability);
        console.log('Is userAvailability an array?', Array.isArray(userAvailability));
        console.log('Current isAvailableToPlay:', isAvailableToPlay);
        
        saveAvailabilityBtn.disabled = true;
        saveAvailabilityBtn.innerHTML = '<span class="save-icon">⏳</span> Saving...';
        
        // Prepare the data - even if empty object, we still want to save visibility status
        const availabilityJson = JSON.stringify(userAvailability);
        console.log('Availability JSON to send:', availabilityJson);
        
        const requestBody = `action=save_availability&availability=${encodeURIComponent(availabilityJson)}&isAvailable=${isAvailableToPlay ? 1 : 0}`;
        console.log('Request body:', requestBody);
        
        const response = await fetch('FindPlayerAPI.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: requestBody
        });
        
        console.log('Response status:', response.status);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
                
                if (data.success) {
                    hasUnsavedChanges = false;
                    updateSaveButtonState();
                    showSaveStatus('✅ Availability saved successfully!', 'success');
                    saveAvailabilityBtn.innerHTML = '<span class="save-icon">💾</span> Save Availability & Settings';
                    
                    // Reload data to confirm it was saved
                    setTimeout(() => {
                        loadUserAvailability();
                        loadVisibilityStatus();
                    }, 1000);
                } else {
                    const errorMessage = data.error || 'Unknown error occurred';
                    console.error('API returned error:', errorMessage);
                    showSaveStatus(`❌ ${errorMessage}`, 'error');
                }
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                showSaveStatus('❌ Invalid response from server', 'error');
            }
        } else {
            console.error('HTTP error:', response.status, responseText);
            showSaveStatus(`❌ Server error (${response.status}): ${responseText}`, 'error');
        }
    } catch (error) {
        console.error('Network or other error:', error);
        showSaveStatus(`❌ Network error: ${error.message}`, 'error');
    } finally {
        saveAvailabilityBtn.disabled = false;
        if (saveAvailabilityBtn.innerHTML.includes('Saving')) {
            saveAvailabilityBtn.innerHTML = '<span class="save-icon">💾</span> Save Availability & Settings';
        }
    }
}

function showSaveStatus(message, type = 'info') {
    if (saveStatus) {
        saveStatus.textContent = message;
        saveStatus.className = `save-status ${type}`;
        
        setTimeout(() => {
            saveStatus.textContent = '';
            saveStatus.className = 'save-status';
        }, 3000);
    }
    
    showNotification(message, type);
}

async function toggleVisibility() {
    try {
        isAvailableToPlay = availableToggle.checked;
        markAsUnsaved(); // Mark as unsaved when toggling
        
        showNotification(`Visibility ${isAvailableToPlay ? 'enabled' : 'disabled'}`, 'info');
    } catch (error) {
        console.error('Error toggling visibility:', error);
        showNotification('Error updating visibility', 'error');
    }
}

// Sort By Me - Show players with same sports and availability
async function sortByMe() {
    try {
        sortByMeBtn.disabled = true;
        sortByMeBtn.textContent = 'Loading...';
        
        showNotification('🔍 Finding players who match your favorite sports and availability...', 'info');
        
        const response = await fetch('FindPlayerAPI.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'action=sort_by_me'
        });
        
        if (response.ok) {
            currentPlayers = await response.json();
            renderPlayers();
            
            const playerCount = currentPlayers.length;
            if (playerCount > 0) {
                showNotification(`✅ Found ${playerCount} player(s) matching your criteria!`, 'success');
            } else {
                showNotification('ℹ️ No players found matching your preferences. Try adjusting your availability or favorite sports.', 'info');
            }
        }
    } catch (error) {
        console.error('Error sorting by me:', error);
        showNotification('❌ Error filtering players. Please try again.', 'error');
    } finally {
        sortByMeBtn.disabled = false;
        sortByMeBtn.textContent = 'Sort By Me';
    }
}

// Regular search - search through ALL players
function searchPlayers(searchTerm) {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        if (searchTerm.trim() === '') {
            // If empty search, show all players
            currentPlayers = [...allPlayers];
        } else {
            // Filter all players by search term
            const filteredPlayers = allPlayers.filter(player => 
                player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.favorite_sports.some(sport => sport.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            currentPlayers = filteredPlayers;
        }
        
        renderPlayers();
    }, 300);
}

function renderPlayers(playersToRender = currentPlayers) {
    if (!playersGrid) return;
    
    if (playersToRender.length === 0) {
        playersGrid.innerHTML = `
            <div class="no-players">
                <h3>No players found</h3>
                <p>Try adjusting your search or availability settings.</p>
            </div>
        `;
        return;
    }
    
    playersGrid.innerHTML = playersToRender.map(player => `
        <div class="player-card" onclick="openPlayerModal('${player.username}', '${player.name}', '${player.favorite_sports.join(', ')}', '${player.age}', '${player.gender}', '${player.phone}', '${player.distance}', '${player.image}')">
            <div class="player-image">
                <img src="${player.image}" alt="${player.name}" onerror="this.src='../../../Images/default.jpg'" />
            </div>
            <div class="player-details">
                <h4 class="player-name">${player.name}</h4>
                <p class="player-sport">Sport: ${player.favorite_sports.length > 0 ? player.favorite_sports.join(', ') : 'Not specified'}</p>
                <p class="player-location">${player.distance}</p>
                <div class="player-actions">
                    <button class="add-friend-btn" onclick="event.stopPropagation(); addFriend('${player.username}')">Add Friend</button>
                    <button class="connect-btn" onclick="event.stopPropagation(); connectToChat('${player.username}')">Connect</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addFriend(playerUsername) {
    // Send friend request
    fetch('FindPlayerAPI.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `action=add_friend&target_username=${playerUsername}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Friend request sent to ${playerUsername}!`, 'success');
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error adding friend:', error);
        showNotification('Error sending friend request', 'error');
    });
}

// Connect to chat
function connectToChat(playerUsername) {
    // Redirect to chat page with the player
    window.location.href = `../chats/chats.php?user=${playerUsername}`;
}

function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchPlayers(e.target.value);
        });
    }
    
    // Sort by me button
    if (sortByMeBtn) {
        sortByMeBtn.addEventListener('click', sortByMe);
    }
    
    // Available toggle
    if (availableToggle) {
        availableToggle.addEventListener('change', toggleVisibility);
    }
    
    // Select all button
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', handleSelectAll);
    }
    
    // Save availability button
    if (saveAvailabilityBtn) {
        console.log('Save button found, adding event listener');
        saveAvailabilityBtn.addEventListener('click', () => {
            console.log('Save button clicked!');
            saveAvailabilityToDatabase();
        });
    } else {
        console.error('Save button not found!');
    }
    
    // Modal close
    if (closeModal) {
        closeModal.addEventListener('click', closePlayerModal);
    }
    
    // Close modal when clicking outside
    if (playerModal) {
        window.addEventListener('click', (e) => {
            if (e.target === playerModal) {
                closePlayerModal();
            }
        });
    }
}

function handleSelectAll() {
    const checkboxes = document.querySelectorAll('.day-card input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    console.log('HandleSelectAll called, allChecked:', allChecked); // Debug log
    
    if (!allChecked) {
        // SELECT ALL DAYS
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const dayCard = checkbox.closest('.day-card');
            const day = dayCard.dataset.day;
            
            console.log(`Selecting day: ${day}`); // Debug log
            
            // Add active class
            dayCard.classList.add('active');
            
            // Initialize this day as all-day available (empty array)
            userAvailability[day] = [];
            console.log(`Initialized ${day} as all-day available`);
            
            // Show add button for this day
            showAddButton(day);
        });
        
        selectAllBtn.textContent = 'Deselect All';
        console.log('All days selected, userAvailability:', userAvailability);
        
    } else {
        // DESELECT ALL DAYS
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const dayCard = checkbox.closest('.day-card');
            const day = dayCard.dataset.day;
            
            console.log(`Deselecting day: ${day}`); // Debug log
            
            // Remove active class
            dayCard.classList.remove('active');
            
            // Clear the time slots container
            const container = document.getElementById(`slots-${day}`);
            container.innerHTML = '';
            
            // Remove from availability object
            delete userAvailability[day];
            console.log(`Removed ${day} from availability`);
        });
        
        selectAllBtn.textContent = 'Select Everyday';
        console.log('All days deselected, userAvailability:', userAvailability);
    }
    
    console.log('Final userAvailability after selectAll:', userAvailability); // Debug log
    markAsUnsaved();
}

function openPlayerModal(username, name, sports, age, gender, phone, distance, image) {
    if (!playerModal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${image}" alt="${name}" class="modal-player-image" onerror="this.src='../../../Images/default.jpg'" />
            <h2>${name}</h2>
        </div>
        <div class="modal-content">
            <div class="modal-info">
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Sports:</strong> ${sports || 'Not specified'}</p>
                <p><strong>Age:</strong> ${age || 'Not specified'}</p>
                <p><strong>Gender:</strong> ${gender || 'Not specified'}</p>
                <p><strong>Phone:</strong> ${phone || 'Not specified'}</p>
                <p><strong>Distance:</strong> ${distance}</p>
            </div>
            <div class="modal-actions">
                <button class="modal-btn primary" onclick="addFriend('${username}')">Add Friend</button>
                <button class="modal-btn secondary" onclick="connectToChat('${username}')">Connect</button>
            </div>
        </div>
    `;
    
    playerModal.style.display = 'block';
}

function closePlayerModal() {
    if (playerModal) {
        playerModal.style.display = 'none';
    }
}

// Debug function - call this from console to check userAvailability
window.debugAvailability = function() {
    console.log('=== AVAILABILITY DEBUG ===');
    console.log('Current userAvailability object:', userAvailability);
    console.log('Available to play:', isAvailableToPlay);
    console.log('Object.keys(userAvailability):', Object.keys(userAvailability));
    console.log('Is userAvailability an array?', Array.isArray(userAvailability));
    console.log('Type of userAvailability:', typeof userAvailability);
    
    for (let day in userAvailability) {
        console.log(`Day: ${day}, Slots:`, userAvailability[day]);
        if (userAvailability[day].length === 0) {
            console.log(`  -> ${day} is ALL DAY available`);
        } else {
            console.log(`  -> ${day} has specific time slots:`, userAvailability[day]);
        }
    }
    
    // Check checkboxes state
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0, 3));
        console.log(`${day} checkbox checked:`, checkbox ? checkbox.checked : 'NOT FOUND');
    });
    
    console.log('JSON that would be sent:', JSON.stringify(userAvailability));
    console.log('=== END DEBUG ===');
    
    return userAvailability;
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        font-family: Arial, sans-serif;
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}