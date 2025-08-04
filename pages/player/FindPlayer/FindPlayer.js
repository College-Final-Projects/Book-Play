// Cleaned version: data removed for DB integration
let currentPlayers = [];
let userAvailability = {};
let isAvailableToPlay = true;
let searchTimeout;
let friendsList = []; // Store friends list

// Sample players data (replace with your database data)
const allPlayers = [
    { name: 'Messi', email: 'messi@example.com', sport: 'Soccer', age: '36', gender: 'Male', phone: '+972-50-123-4567', location: 'Tel Aviv', distance: '2.5 km away', image: 'https://fcb-abj-pre.s3.amazonaws.com/img/jugadors/MESSI.jpg' },
    { name: 'Sarah', email: 'sarah@example.com', sport: 'Tennis', age: '28', gender: 'Female', phone: '+972-50-765-4321', location: 'Tel Aviv', distance: '1.8 km away', image: 'https://thumbs.dreamstime.com/b/female-playing-tennis-waiting-ball-38898405.jpg' },
    { name: 'Michael', email: 'michael@example.com', sport: 'Basketball', age: '24', gender: 'Male', phone: '+972-50-234-5678', location: 'Haifa', distance: '5.2 km away', image: 'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Emma', email: 'emma@example.com', sport: 'Swimming', age: '22', gender: 'Female', phone: '+972-50-345-6789', location: 'Netanya', distance: '3.7 km away', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'David', email: 'david@example.com', sport: 'Running', age: '30', gender: 'Male', phone: '+972-50-456-7890', location: 'Jerusalem', distance: '8.1 km away', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Luna', email: 'luna@example.com', sport: 'Volleyball', age: '26', gender: 'Female', phone: '+972-50-567-8901', location: 'Eilat', distance: '4.3 km away', image: 'https://images.unsplash.com/photo-1594736797933-d0fce0ba4d2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'James', email: 'james@example.com', sport: 'Cycling', age: '29', gender: 'Male', phone: '+972-50-678-9012', location: 'Be er Sheva', distance: '6.8 km away', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Sophia', email: 'sophia@example.com', sport: 'Yoga', age: '25', gender: 'Female', phone: '+972-50-789-0123', location: 'Herzliya', distance: '2.1 km away', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Alex', email: 'alex@example.com', sport: 'Boxing', age: '27', gender: 'Male', phone: '+972-50-890-1234', location: 'Ashdod', distance: '7.5 km away', image: 'https://images.unsplash.com/photo-1549476464-37392f717541?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Maya', email: 'maya@example.com', sport: 'Pilates', age: '31', gender: 'Female', phone: '+972-50-901-2345', location: 'Rishon LeZion', distance: '3.2 km away', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Oliver', email: 'oliver@example.com', sport: 'Golf', age: '35', gender: 'Male', phone: '+972-50-012-3456', location: 'Caesarea', distance: '9.4 km away', image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Zoe', email: 'zoe@example.com', sport: 'Rock Climbing', age: '23', gender: 'Female', phone: '+972-50-123-4567', location: 'Tiberias', distance: '12.1 km away', image: 'https://images.unsplash.com/photo-1522163723043-478ef79a5bb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Ryan', email: 'ryan@example.com', sport: 'Surfing', age: '26', gender: 'Male', phone: '+972-50-234-5678', location: 'Ashkelon', distance: '15.7 km away', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Aria', email: 'aria@example.com', sport: 'Badminton', age: '24', gender: 'Female', phone: '+972-50-345-6789', location: 'Kfar Saba', distance: '4.9 km away', image: 'https://images.unsplash.com/photo-1594736797933-d0fce0ba4d2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
    { name: 'Ethan', email: 'ethan@example.com', sport: 'Martial Arts', age: '32', gender: 'Male', phone: '+972-50-456-7890', location: 'Ramat Gan', distance: '6.3 km away', image: 'https://images.unsplash.com/photo-1555597408-51bc5d65bedf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
];

const searchInput = document.getElementById('searchInput');
const sortByMeBtn = document.getElementById('sortByMeBtn');
const availableToggle = document.getElementById('availableToggle');
const selectAllBtn = document.getElementById('selectAllBtn');
const playersGrid = document.getElementById('playersGrid');
const playerModal = document.getElementById('playerModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

document.addEventListener('DOMContentLoaded', () => {
    initializeAvailability();
    setupEventListeners();
    currentPlayers = [...allPlayers]; // Initialize with all players
    renderPlayers(); // Render players on page load
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
    div.innerHTML = '<input type="time" class="start-time"><span>–</span><input type="time" class="end-time"><button class="delete-slot" onclick="deleteTimeSlot(this)">×</button>';
    const addBtn = container.querySelector('.add-slot-btn');
    if (addBtn) addBtn.remove();
    container.appendChild(div);
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => input.addEventListener('change', () => updateUserAvailability(day)));
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
        const isFriend = friendsList.includes(player.name);
        return `
        <div class="player-card" onclick="openPlayerModal('${player.name}', '${player.email}', '${player.sport}', '${player.age}', '${player.gender}', '${player.phone}', '${player.location}', '${player.image}')">
            <div class="player-image">
                <img src="${player.image}" alt="${player.name}" />
            </div>
            <div class="player-details">
                <h4 class="player-name">${player.name}</h4>
                <p class="player-sport">Sport: ${player.sport}</p>
                <p class="player-location">${player.distance}</p>
                <div class="player-actions">
                    <button class="add-friend-btn ${isFriend ? 'added' : ''}" 
                            onclick="event.stopPropagation(); addFriend('${player.name}')" 
                            ${isFriend ? 'disabled' : ''}>
                        ${isFriend ? 'Friend Added' : 'Add Friend'}
                    </button>
                    <button class="connect-btn" onclick="event.stopPropagation()">Connect</button>
                </div>
            </div>
        </div>
    `;}).join('');
}

// Add Friend functionality
function addFriend(playerName) {
    // Check if already friends
    if (friendsList.includes(playerName)) {
        alert(`${playerName} is already in your friends list!`);
        return;
    }
    
    // Add to friends list
    friendsList.push(playerName);
    
    // Show success message
    alert(`${playerName} has been added to your friends list!`);
    
    // Re-render players to update button state
    renderPlayers();
    
    console.log('Current friends list:', friendsList);
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