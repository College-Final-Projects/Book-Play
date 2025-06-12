// Sample groups data
const groupsData = [
    {
        id: 1,
        title: "Elite Basketball Team",
        location: "Downtown Sports Complex, City Center",
        sport: "basketball",
        price: 25,
        players: 8,
        maxPlayers: 10,
        status: "public",
        password: "",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: false
    },
    {
        id: 2,
        title: "Champions Football Squad",
        location: "North District Athletic Center",
        sport: "football",
        price: 30,
        players: 18,
        maxPlayers: 22,
        status: "public",
        password: "",
        image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: true
    },
    {
        id: 3,
        title: "Premium Tennis Club",
        location: "Westside Tennis Club",
        sport: "tennis",
        price: 40,
        players: 6,
        maxPlayers: 8,
        status: "private",
        password: "tennis123",
        image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: false
    },
    {
        id: 4,
        title: "Victory Volleyball Team",
        location: "Central Sports Complex",
        sport: "volleyball",
        price: 20,
        players: 10,
        maxPlayers: 12,
        status: "public",
        password: "",
        image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: false
    },
    {
        id: 5,
        title: "Pro Badminton Group",
        location: "East Side Sports Hub",
        sport: "badminton",
        price: 15,
        players: 5,
        maxPlayers: 8,
        status: "private",
        password: "badminton456",
        image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: true
    },
    {
        id: 6,
        title: "Splash Swimming Team",
        location: "Aquatic Center Marina",
        sport: "swimming",
        price: 35,
        players: 12,
        maxPlayers: 15,
        status: "public",
        password: "",
        image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        favorited: false
    }
];

let filteredGroups = [...groupsData];
let currentGroupId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    renderGroups();
    initializeFilters();
    initializeSearch();
    initializeModal();
});

// Render groups
function renderGroups() {
    const grid = document.getElementById('groupsGrid');
    grid.innerHTML = '';

    filteredGroups.forEach(group => {
        const groupCard = createGroupCard(group);
        grid.appendChild(groupCard);
    });
}

// Create group card
function createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
        <div style="position: relative;">
            <img src="${group.image}" alt="${group.title}" class="group-image">
            <button class="favorite-btn ${group.favorited ? 'favorited' : ''}" onclick="toggleFavorite(${group.id})">
                ${group.favorited ? '❤️' : '🤍'}
            </button>
            <span class="status-badge ${group.status}">${group.status}</span>
        </div>
        <div class="group-info">
            <h3 class="group-title">${group.title}</h3>
            <p class="group-location">📍 ${group.location}</p>
            <div class="group-details">
                <span class="sport-type">${group.sport}</span>
                <span class="players-count">${group.players}/${group.maxPlayers} players</span>
            </div>
            <div class="group-actions">
                <div class="group-price">
                    ₪${group.price}<small>/person</small>
                </div>
                <button class="join-btn" onclick="joinGroup(${group.id})">
                    Join Group
                </button>
            </div>
        </div>
    `;
    return card;
}

// Toggle favorite
function toggleFavorite(groupId) {
    const group = groupsData.find(g => g.id === groupId);
    group.favorited = !group.favorited;
    
    // Update filtered groups if it exists there
    const filteredGroup = filteredGroups.find(g => g.id === groupId);
    if (filteredGroup) {
        filteredGroup.favorited = group.favorited;
    }
    
    renderGroups();
}

// Join group
function joinGroup(groupId) {
    const group = groupsData.find(g => g.id === groupId);
    
    if (group.status === 'private') {
        currentGroupId = groupId;
        document.getElementById('passwordModal').style.display = 'block';
    } else {
        confirmJoinGroup(groupId);
    }
}

// Confirm join group
function confirmJoinGroup(groupId) {
    const group = groupsData.find(g => g.id === groupId);
    
    if (group.players < group.maxPlayers) {
        group.players++;
        
        // Update filtered groups
        const filteredGroup = filteredGroups.find(g => g.id === groupId);
        if (filteredGroup) {
            filteredGroup.players = group.players;
        }
        
        alert(`Successfully joined ${group.title}!`);
        renderGroups();
    } else {
        alert('This group is full!');
    }
}

// Initialize filters
function initializeFilters() {
    const sportRadios = document.querySelectorAll('input[name="sport"]');
    const statusRadios = document.querySelectorAll('input[name="status"]');
    const distanceRadios = document.querySelectorAll('input[name="distance"]');

    [...sportRadios, ...statusRadios, ...distanceRadios].forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });

    // Update active filter styling
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Remove active class from siblings
            this.parentNode.querySelectorAll('.filter-option').forEach(sibling => {
                sibling.classList.remove('active');
            });
            
            // Add active class to clicked option
            this.classList.add('active');
            
            applyFilters();
        });
    });
}

// Apply filters
function applyFilters() {
    const selectedSport = document.querySelector('input[name="sport"]:checked').value;
    const selectedStatus = document.querySelector('input[name="status"]:checked').value;
    const selectedDistance = document.querySelector('input[name="distance"]:checked').value;

    filteredGroups = groupsData.filter(group => {
        const sportMatch = selectedSport === 'all' || group.sport === selectedSport;
        const statusMatch = selectedStatus === 'all' || group.status === selectedStatus;
        return sportMatch && statusMatch;
    });

    // Apply distance sorting
    if (selectedDistance === 'nearest') {
        filteredGroups.sort((a, b) => a.location.localeCompare(b.location));
    } else if (selectedDistance === 'farthest') {
        filteredGroups.sort((a, b) => b.location.localeCompare(a.location));
    }

    renderGroups();
}

// Initialize search
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Perform search
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        applyFilters();
        return;
    }

    filteredGroups = groupsData.filter(group => {
        return group.title.toLowerCase().includes(searchTerm) ||
               group.location.toLowerCase().includes(searchTerm) ||
               group.sport.toLowerCase().includes(searchTerm);
    });

    renderGroups();
}

// Initialize modal
function initializeModal() {
    const modal = document.getElementById('passwordModal');
    const closeBtn = document.querySelector('.close');
    const submitBtn = document.getElementById('submitPassword');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        currentGroupId = null;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            currentGroupId = null;
        }
    });

    submitBtn.addEventListener('click', () => {
        const enteredPassword = document.getElementById('groupPassword').value;
        const group = groupsData.find(g => g.id === currentGroupId);

        if (enteredPassword === group.password) {
            modal.style.display = 'none';
            document.getElementById('groupPassword').value = '';
            confirmJoinGroup(currentGroupId);
            currentGroupId = null;
        } else {
            alert('Incorrect password!');
        }
    });

    // Enter key support for password input
    document.getElementById('groupPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
}