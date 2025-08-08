// MyFriends.js - Full Database Integration

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
    loadFriendRequests();
    loadCurrentFriends();
    setupEventListeners();
});

// Load friend requests from database
function loadFriendRequests() {
    fetch('friends_api.php?action=get_requests')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                friendRequests = data.requests;
                renderFriendRequests();
                updateStats();
            } else {
                console.error('Failed to load friend requests:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading friend requests:', error);
        });
}

// Load current friends from database
function loadCurrentFriends() {
    fetch('friends_api.php?action=get_friends')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentFriends = data.friends;
                renderCurrentFriends();
                updateStats();
            } else {
                console.error('Failed to load friends:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading friends:', error);
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
        <div class="friend-request-card">
            <div class="friend-info">
                <img src="${request.user_image ? '../../../uploads/users/' + request.user_image : '../../../uploads/users/default.jpg'}" 
                     alt="${request.first_name}" class="friend-avatar">
                <div class="friend-details">
                    <h4>${request.first_name} ${request.last_name}</h4>
                    <p>${request.email}</p>
                    <p class="request-date">Requested ${formatDate(request.created_at)}</p>
                </div>
            </div>
            <div class="request-actions">
                <button class="accept-btn" onclick="acceptFriendRequest(${request.id})">Accept</button>
                <button class="reject-btn" onclick="rejectFriendRequest(${request.id})">Reject</button>
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
            friend.email.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredFriends.length === 0) {
        currentFriendsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Friends Found</h3>
                <p>${searchTerm ? 'No friends match your search criteria.' : 'You haven\'t added any friends yet.'}</p>
            </div>
        `;
        return;
    }

    currentFriendsContainer.innerHTML = filteredFriends.map(friend => `
        <div class="friend-card">
            <div class="friend-info">
                <img src="${friend.user_image ? '../../../uploads/users/' + friend.user_image : '../../../uploads/users/default.jpg'}" 
                     alt="${friend.first_name}" class="friend-avatar">
                <div class="friend-details">
                    <h4>${friend.first_name} ${friend.last_name}</h4>
                    <p>${friend.email}</p>
                    ${friend.age ? `<p>Age: ${friend.age}</p>` : ''}
                    ${friend.Gender ? `<p>Gender: ${friend.Gender}</p>` : ''}
                </div>
            </div>
            <div class="friend-actions">
                <button class="message-btn" onclick="messageFriend('${friend.username}')">Message</button>
                <button class="remove-btn" onclick="removeFriend('${friend.username}')">Remove</button>
            </div>
        </div>
    `).join('');
}

function handleSearch() {
    renderCurrentFriends();
}

function acceptFriendRequest(requestId) {
    const formData = new FormData();
    formData.append('action', 'accept_request');
    formData.append('request_id', requestId);
    
    fetch('friends_api.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadFriendRequests();
            loadCurrentFriends();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error accepting friend request:', error);
        alert('Failed to accept friend request. Please try again.');
    });
}

function rejectFriendRequest(requestId) {
    const formData = new FormData();
    formData.append('action', 'reject_request');
    formData.append('request_id', requestId);
    
    fetch('friends_api.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadFriendRequests();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error rejecting friend request:', error);
        alert('Failed to reject friend request. Please try again.');
    });
}

function removeFriend(friendUsername) {
    if (!confirm(`Are you sure you want to remove ${friendUsername} from your friends list?`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'remove_friend');
    formData.append('friend_username', friendUsername);
    
    fetch('friends_api.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadCurrentFriends();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error removing friend:', error);
        alert('Failed to remove friend. Please try again.');
    });
}

function messageFriend(friendUsername) {
    // Redirect to chat page with the friend
    window.location.href = `../Chats/Chats.php?friend=${encodeURIComponent(friendUsername)}`;
}

function showFriendModal(friendId) {
    // To be implemented with friend profile data
}

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function goToFindPlayers() {}
function goToBookings() {}
function goToMessages() {}
function goToProfile() {}
function logout() {}
