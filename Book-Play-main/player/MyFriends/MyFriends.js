// Cleaned MyFriends.js - Ready for DB integration

let friendRequests = [];
let currentFriends = [];

const friendSearch = document.getElementById('friendSearch');
const friendRequestsContainer = document.getElementById('friendRequests');
const currentFriendsContainer = document.getElementById('currentFriends');
const friendModal = document.getElementById('friendModal');
const friendModalBody = document.getElementById('friendModalBody');
const closeModal = document.querySelector('.close');

document.addEventListener('DOMContentLoaded', function() {
    console.log('My Friends page loaded');
    updateStats();
    renderFriendRequests();
    renderCurrentFriends();
    setupEventListeners();
});

function setupEventListeners() {
    if (friendSearch) {
        friendSearch.addEventListener('input', handleSearch);
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            friendModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === friendModal) {
            friendModal.style.display = 'none';
        }
    });
}

function updateStats() {
    document.getElementById('totalFriends').textContent = currentFriends.length;
    document.getElementById('totalRequests').textContent = friendRequests.length;
    document.getElementById('requestsBadge').textContent = friendRequests.length;
    document.getElementById('friendsBadge').textContent = currentFriends.length;
}

function renderFriendRequests() {
    if (friendRequests.length === 0) {
        friendRequestsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Friend Requests</h3>
                <p>You're all caught up! No pending friend requests.</p>
            </div>
        `;
        return;
    }

    friendRequestsContainer.innerHTML = ''; // Content will be dynamically injected later
}

function renderCurrentFriends() {
    let filteredFriends = [...currentFriends];
    const searchTerm = friendSearch ? friendSearch.value.toLowerCase().trim() : '';
    if (searchTerm) {
        filteredFriends = filteredFriends.filter(friend =>
            friend.first_name.toLowerCase().includes(searchTerm) ||
            friend.last_name.toLowerCase().includes(searchTerm) ||
            friend.sport.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredFriends.length === 0) {
        currentFriendsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Friends Found</h3>
                <p>No friends match your search criteria.</p>
            </div>
        `;
        return;
    }

    currentFriendsContainer.innerHTML = ''; // Content will be dynamically injected later
}

function handleSearch() {
    renderCurrentFriends();
}

function acceptFriendRequest(requestId) {
    // To be implemented with database logic
}

function rejectFriendRequest(requestId) {
    // To be implemented with database logic
}

function messageFriend(friendId) {
    // To be implemented with chat system
}

function showFriendModal(friendId) {
    // To be implemented with friend profile data
}

function goToFindPlayers() {}
function goToBookings() {}
function goToMessages() {}
function goToProfile() {}
function logout() {}
