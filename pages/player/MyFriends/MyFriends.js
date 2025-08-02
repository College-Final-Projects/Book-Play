// MyFriends.js - Real Database Integration

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
    loadFriendsData();
    setupEventListeners();
});

function loadFriendsData() {
    fetch('MyFriendsAPI.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                friendRequests = data.requests;
                currentFriends = data.friends;
                updateStats();
                renderFriendRequests();
                renderCurrentFriends();
            } else {
                console.error('Failed to load friends data:', data.message);
            }
        })
        .catch(err => {
            console.error('Error loading friends data:', err);
        });
}

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

    friendRequestsContainer.innerHTML = friendRequests.map(request => `
        <div class="request-card">
            <div class="friend-avatar">
                <img src="${request.user_image || '../../../Images/default.jpg'}" alt="${request.first_name}">
            </div>
            <div class="friend-info">
                <div class="friend-name">${request.first_name} ${request.last_name}</div>
                <div class="friend-sport">${request.sport || 'No sport specified'}</div>
                <div class="last-active">Last active: ${formatLastActive(request.last_active)}</div>
            </div>
            <div class="friend-actions">
                <button class="action-btn accept-btn" onclick="acceptFriendRequest('${request.username}')">✓ Accept</button>
                <button class="action-btn reject-btn" onclick="rejectFriendRequest('${request.username}')">✗ Reject</button>
            </div>
        </div>
    `).join('');
}

function renderCurrentFriends() {
    let filteredFriends = [...currentFriends];
    const searchTerm = friendSearch ? friendSearch.value.toLowerCase().trim() : '';
    if (searchTerm) {
        filteredFriends = filteredFriends.filter(friend =>
            friend.first_name.toLowerCase().includes(searchTerm) ||
            friend.last_name.toLowerCase().includes(searchTerm) ||
            (friend.sport && friend.sport.toLowerCase().includes(searchTerm))
        );
    }

    if (filteredFriends.length === 0) {
        currentFriendsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Friends Found</h3>
                <p>${searchTerm ? 'No friends match your search criteria.' : 'You don\'t have any friends yet. Start connecting with other players!'}</p>
            </div>
        `;
        return;
    }

    currentFriendsContainer.innerHTML = filteredFriends.map(friend => `
        <div class="friend-card ${friend.is_online ? 'online' : ''}">
            <div class="friend-avatar" onclick="showFriendModal('${friend.username}')">
                <img src="${friend.user_image || '../../../Images/default.jpg'}" alt="${friend.first_name}">
            </div>
            <div class="friend-info">
                <div class="friend-name">${friend.first_name} ${friend.last_name}</div>
                <div class="friend-sport">${friend.sport || 'No sport specified'}</div>
                <div class="last-active">${friend.is_online ? '🟢 Online' : `Last active: ${formatLastActive(friend.last_active)}`}</div>
            </div>
            <div class="friend-actions">
                <button class="action-btn message-btn" onclick="messageFriend('${friend.username}')">💬 Message</button>
                <button class="action-btn play-btn" onclick="playWithFriend('${friend.username}')">🎮 Play</button>
                <button class="action-btn remove-btn" onclick="removeFriend('${friend.username}')">🗑️ Remove</button>
            </div>
        </div>
    `).join('');
}

function handleSearch() {
    renderCurrentFriends();
}

function acceptFriendRequest(friendUsername) {
    fetch('FriendActionsAPI.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', friend_username: friendUsername })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Friend request accepted!');
            loadFriendsData(); // Reload data
        } else {
            alert('Failed to accept request: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error accepting friend request:', err);
        alert('An error occurred while accepting the friend request.');
    });
}

function rejectFriendRequest(friendUsername) {
    if (confirm('Are you sure you want to reject this friend request?')) {
        fetch('FriendActionsAPI.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject', friend_username: friendUsername })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Friend request rejected.');
                loadFriendsData(); // Reload data
            } else {
                alert('Failed to reject request: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error rejecting friend request:', err);
            alert('An error occurred while rejecting the friend request.');
        });
    }
}

function removeFriend(friendUsername) {
    if (confirm('Are you sure you want to remove this friend?')) {
        fetch('FriendActionsAPI.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', friend_username: friendUsername })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Friend removed.');
                loadFriendsData(); // Reload data
            } else {
                alert('Failed to remove friend: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error removing friend:', err);
            alert('An error occurred while removing the friend.');
        });
    }
}

function messageFriend(friendUsername) {
    // Redirect to chat page
    window.location.href = '../Chats/Chats.php';
}

function playWithFriend(friendUsername) {
    // Redirect to find players page
    window.location.href = '../FindPlayer/FindPlayer.php';
}

function showFriendModal(friendUsername) {
    // Find friend data
    const friend = currentFriends.find(f => f.username === friendUsername);
    if (friend) {
        friendModalBody.innerHTML = `
            <div class="friend-profile">
                <img src="${friend.user_image || '../../../Images/default.jpg'}" alt="${friend.first_name}" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 16px;">
                <h3>${friend.first_name} ${friend.last_name}</h3>
                <p><strong>Sport:</strong> ${friend.sport || 'No sport specified'}</p>
                <p><strong>Status:</strong> ${friend.is_online ? '🟢 Online' : '⚫ Offline'}</p>
                <p><strong>Last Active:</strong> ${formatLastActive(friend.last_active)}</p>
            </div>
        `;
        friendModal.style.display = 'block';
    }
}

function formatLastActive(lastActive) {
    if (!lastActive) return 'Unknown';
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now - lastActiveDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastActiveDate.toLocaleDateString();
}

function goToFindPlayers() {}
function goToBookings() {}
function goToMessages() {}
function goToProfile() {}
function logout() {}
