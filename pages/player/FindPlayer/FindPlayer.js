// Database integration for users
let currentPlayers = [];
let userAvailability = {};
let isAvailableToPlay = false; // Changed to false by default
let searchTimeout;
let friendsList = []; // Store friends list
let allPlayers = []; // Will be populated from database

const searchInput = document.getElementById('searchInput');
const sortByMeBtn = document.getElementById('sortByMeBtn');
const availableToggle = document.getElementById('availableToggle');
const selectAllBtn = document.getElementById('selectAllBtn');
const playersGrid = document.getElementById('playersGrid');
const playerModal = document.getElementById('playerModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');
const collapseBtn = document.getElementById('collapseBtn');
const daysContainer = document.getElementById('daysContainer');

const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

document.addEventListener('DOMContentLoaded', () => {
    initializeAvailability();
    setupEventListeners();
    loadUserAvailability(); // Load saved availability
    loadFriendsList(); // Load friends list from database
    loadUsersFromDatabase(); // Load users from database
});

// Load users from database
async function loadUsersFromDatabase() {
    try {
        const response = await fetch('fetch_users.php');
        if (response.ok) {
            const data = await response.json();
            allPlayers = data.users || [];
            currentPlayers = [...allPlayers];
            renderPlayers();
        } else {
            console.error('Error loading users:', response.statusText);
            // Fallback to empty array
            allPlayers = [];
            currentPlayers = [];
            renderPlayers();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to empty array
        allPlayers = [];
        currentPlayers = [];
        renderPlayers();
    }
}

// Load user availability from database
async function loadUserAvailability() {
    try {
        const response = await fetch('availability_api.php?action=get_availability');
        if (response.ok) {
            const data = await response.json();
            userAvailability = data.availability || {};
            isAvailableToPlay = data.isAvailable || false;
            
            // Update UI to reflect loaded data
            updateAvailabilityUI();
            
            // Update toggle state
            if (availableToggle) {
                availableToggle.checked = isAvailableToPlay;
            }
            
            // Update save button state
            updateSaveButtonState();
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

// Update UI to reflect loaded availability data
function updateAvailabilityUI() {
    days.forEach(day => {
        const checkbox = document.getElementById(day.substring(0,3));
        const container = document.getElementById(`slots-${day}`);
        const card = document.querySelector(`[data-day="${day}"]`);
        
        if (checkbox && container && card) {
            if (userAvailability[day] && userAvailability[day].length > 0) {
                checkbox.checked = true;
                card.classList.add('active');
                
                // Clear existing slots
                container.innerHTML = '';
                
                // Add saved time slots
                userAvailability[day].forEach(slot => {
                    addTimeSlotWithValues(day, slot.start, slot.end);
                });
            } else {
                checkbox.checked = false;
                card.classList.remove('active');
                container.innerHTML = '';
            }
        }
    });
}

// Add time slot with specific values
function addTimeSlotWithValues(day, startTime, endTime) {
    const container = document.getElementById(`slots-${day}`);
    if (container.querySelectorAll('.time-slot').length >= 3) return;
    
    const div = document.createElement('div');
    div.className = 'time-slot';
    div.innerHTML = `<input type="time" class="start-time" value="${startTime}"><span>–</span><input type="time" class="end-time" value="${endTime}"><button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>`;
    
    const addBtn = container.querySelector('.add-slot-btn');
    if (addBtn) addBtn.remove();
    container.appendChild(div);
    
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => input.addEventListener('change', () => updateUserAvailability(day)));
    
    if (container.querySelectorAll('.time-slot').length < 3) showAddButton(day);
    updateUserAvailability(day);
}

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
                updateSaveButtonState();
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
    div.innerHTML = '<input type="time" class="start-time"><span>–</span><input type="time" class="end-time"><button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>';
    const addBtn = container.querySelector('.add-slot-btn');
    if (addBtn) addBtn.remove();
    container.appendChild(div);
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => input.addEventListener('change', () => updateUserAvailability(day)));
    if (container.querySelectorAll('.time-slot').length < 3) showAddButton(day);
    updateUserAvailability(day);
    console.log('Time slot added for', day, 'current availability:', userAvailability);
}

function deleteTimeSlot(btn) {
    const container = btn.parentElement.parentElement;
    const day = container.id.replace('slots-','');
    btn.parentElement.remove();
    if (container.querySelectorAll('.time-slot').length < 3) showAddButton(day);
    updateUserAvailability(day);
    console.log('Time slot deleted for', day, 'current availability:', userAvailability);
}

function updateUserAvailability(day) {
    const container = document.getElementById(`slots-${day}`);
    const slots = container.querySelectorAll('.time-slot');
    if (!slots.length) {
        delete userAvailability[day];
        return;
    }
    
    userAvailability[day] = [];
    slots.forEach(slot => {
        const start = slot.querySelector('.start-time').value;
        const end = slot.querySelector('.end-time').value;
        if (start && end) userAvailability[day].push({start: start, end: end});
    });
    
    // Update save button state
    updateSaveButtonState();
}

// Save availability to database
async function saveAvailabilityToDatabase() {
    const saveBtn = document.getElementById('saveAvailabilityBtn');
    if (!saveBtn) return;
    
    // Disable button and show loading state
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Saving...';
    
    try {
        console.log('Saving availability:', userAvailability, 'isAvailable:', isAvailableToPlay);
        
        const response = await fetch('availability_api.php?action=save_availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                availability: userAvailability,
                isAvailable: isAvailableToPlay
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Availability saved successfully:', data);
            
            // Show success state
            saveBtn.textContent = '✅ Saved!';
            saveBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                saveBtn.textContent = '💾 Save Availability';
                saveBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                saveBtn.disabled = false;
                updateSaveButtonState();
            }, 2000);
            
        } else {
            const errorData = await response.json();
            console.error('Error saving availability:', errorData);
            
            // Show error state
            saveBtn.textContent = '❌ Error!';
            saveBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                saveBtn.textContent = '💾 Save Availability';
                saveBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
                saveBtn.disabled = false;
                updateSaveButtonState();
            }, 3000);
        }
    } catch (error) {
        console.error('Error saving availability:', error);
        
        // Show error state
        saveBtn.textContent = '❌ Error!';
        saveBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        
        // Reset button after 3 seconds
        setTimeout(() => {
            saveBtn.textContent = '💾 Save Availability';
            saveBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
            saveBtn.disabled = false;
            updateSaveButtonState();
        }, 3000);
    }
}

// Update save button state based on changes
function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveAvailabilityBtn');
    if (!saveBtn) return;
    
    // Check if there are any changes to save
    const hasChanges = Object.keys(userAvailability).length > 0;
    
    if (hasChanges) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.6';
    }
}

// Search functionality
function searchPlayers(searchTerm) {
    if (!searchTerm.trim()) {
        // If search is empty, show all players
        currentPlayers = [...allPlayers];
    } else {
        // Filter players by username (case-insensitive)
        currentPlayers = allPlayers.filter(player => 
            player.name.toLowerCase().startsWith(searchTerm.toLowerCase())
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
        const isFriend = friendsList.includes(player.username);
        return `
        <div class="player-card" onclick="openPlayerModal('${player.username}', '${player.email}', '${player.sport}', '${player.age}', '${player.gender}', '${player.phone}', '${player.location}', '${player.image}')">
            <div class="player-image">
                <img src="${player.image}" alt="${player.name}" />
            </div>
            <div class="player-details">
                <h4 class="player-name">${player.name}</h4>
                <p class="player-sport">Sport: ${player.sport}</p>
                <p class="player-location">${player.distance}</p>
                <div class="player-actions">
                    <button class="add-friend-btn ${isFriend ? 'added' : ''}" 
                            onclick="event.stopPropagation(); addFriend('${player.username}')" 
                            ${isFriend ? 'disabled' : ''}>
                        ${isFriend ? 'Friend Added' : 'Add Friend'}
                    </button>
                    <button class="connect-btn" onclick="event.stopPropagation(); connectToChat('${player.username}')">Connect</button>
                </div>
            </div>
        </div>
    `;}).join('');
}

// Load friends list from database
async function loadFriendsList() {
    try {
        const response = await fetch('get_friends.php');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                friendsList = data.friends;
                console.log('Loaded friends list:', friendsList);
            }
        }
    } catch (error) {
        console.error('Error loading friends list:', error);
    }
}

// Add Friend functionality
async function addFriend(playerUsername) {
    // Check if already friends
    if (friendsList.includes(playerUsername)) {
        alert(`${playerUsername} is already in your friends list!`);
        return;
    }
    
    try {
        const response = await fetch('add_friend.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                friend_username: playerUsername
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Add to local friends list
            friendsList.push(playerUsername);
            
            // Show success message
            alert(`${playerUsername} has been added to your friends list!`);
            
            // Re-render players to update button state
            renderPlayers();
            
            console.log('Current friends list:', friendsList);
        } else {
            alert(data.error || 'Failed to add friend');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        alert('Failed to add friend. Please try again.');
    }
}

// Connect to chat functionality
function connectToChat(playerUsername) {
    // Navigate to chat page with the selected player
    window.location.href = `../Chats/Chats.php?user=${encodeURIComponent(playerUsername)}`;
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
    
    // Save availability button
    const saveAvailabilityBtn = document.getElementById('saveAvailabilityBtn');
    if (saveAvailabilityBtn) {
        saveAvailabilityBtn.addEventListener('click', saveAvailabilityToDatabase);
    }
    
    if (availableToggle) availableToggle.addEventListener('change', () => {
        isAvailableToPlay = availableToggle.checked;
        console.log('Available toggle changed to:', isAvailableToPlay);
        
        // Update save button state when toggle changes
        updateSaveButtonState();
    });
    
    if (closeModal) closeModal.addEventListener('click', () => playerModal.style.display = 'none');
    
    // Collapsible availability section
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const isCollapsed = daysContainer.style.display === 'none';
            daysContainer.style.display = isCollapsed ? 'grid' : 'none';
            collapseBtn.textContent = isCollapsed ? '▼' : '▲';
        });
    }
}

function handleSelectAll() {
    const allChecked = days.every(day => {
        const checkbox = document.getElementById(day.substring(0,3));
        return checkbox && checkbox.checked;
    });
    
    if (!allChecked) {
        // Select Everyday - Set 24-hour availability for all days
        days.forEach(day => {
            const checkbox = document.getElementById(day.substring(0,3));
            const container = document.getElementById(`slots-${day}`);
            const card = document.querySelector(`[data-day="${day}"]`);
            
            if (checkbox && container && card) {
                checkbox.checked = true;
                card.classList.add('active');
                
                // Clear existing slots and add 24-hour slot (00:00 to 23:59)
                container.innerHTML = '';
                addTimeSlotWithValues(day, '00:00', '23:59');
            }
        });
        
        // Update button text
        if (selectAllBtn) {
            selectAllBtn.textContent = 'Clear All';
        }
        
        // Update save button state
        updateSaveButtonState();
        
        // Automatically save availability when "Select Everyday" is clicked
        console.log('Select Everyday clicked - saving availability automatically');
        setTimeout(() => {
            saveAvailabilityToDatabase();
        }, 100);
        
        // Show success message
        if (selectAllBtn) {
            const originalText = selectAllBtn.textContent;
            selectAllBtn.textContent = '✓ Everyday Selected!';
            selectAllBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            
            setTimeout(() => {
                selectAllBtn.textContent = originalText;
                selectAllBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
            }, 2000);
        }
        
    } else {
        // Clear All - Remove all availability
        days.forEach(day => {
            const checkbox = document.getElementById(day.substring(0,3));
            const container = document.getElementById(`slots-${day}`);
            const card = document.querySelector(`[data-day="${day}"]`);
            
            if (checkbox && container && card) {
                checkbox.checked = false;
                card.classList.remove('active');
                container.innerHTML = '';
                delete userAvailability[day];
            }
        });
        
        // Update button text
        if (selectAllBtn) {
            selectAllBtn.textContent = 'Select Everyday';
        }
        
        // Update save button state
        updateSaveButtonState();
        
        // Show success message for clearing all
        if (selectAllBtn) {
            const originalText = selectAllBtn.textContent;
            selectAllBtn.textContent = '✓ Cleared All!';
            selectAllBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            
            setTimeout(() => {
                selectAllBtn.textContent = originalText;
                selectAllBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
            }, 2000);
        }
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