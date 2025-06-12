// Player data for modal display
const playersData = {
    1: {
        name: "Mike Johnson",
        role: "Host (You)",
        memberSince: "January 2023",
        gamesPlayed: "47",
        rating: "4.8/5.0",
        favoriteSport: "Basketball",
        location: "New York, NY",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: true
    },
    2: {
        name: "Sarah Chen",
        role: "Player",
        memberSince: "March 2023",
        gamesPlayed: "32",
        rating: "4.6/5.0",
        favoriteSport: "Tennis",
        location: "Brooklyn, NY",
        image: "https://images.unsplash.com/photo-1494790108755-2616b332c393?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    3: {
        name: "David Rodriguez",
        role: "Player",
        memberSince: "December 2022",
        gamesPlayed: "56",
        rating: "4.9/5.0",
        favoriteSport: "Soccer",
        location: "Queens, NY",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    4: {
        name: "Emma Wilson",
        role: "Player",
        memberSince: "May 2023",
        gamesPlayed: "28",
        rating: "4.5/5.0",
        favoriteSport: "Volleyball",
        location: "Manhattan, NY",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    5: {
        name: "Alex Thompson",
        role: "Player",
        memberSince: "February 2023",
        gamesPlayed: "41",
        rating: "4.7/5.0",
        favoriteSport: "Basketball",
        location: "Bronx, NY",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    6: {
        name: "Jessica Lee",
        role: "Player",
        memberSince: "April 2023",
        gamesPlayed: "35",
        rating: "4.8/5.0",
        favoriteSport: "Badminton",
        location: "Staten Island, NY",
        image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    7: {
        name: "Marcus Johnson",
        role: "Player",
        memberSince: "June 2023",
        gamesPlayed: "23",
        rating: "4.4/5.0",
        favoriteSport: "Basketball",
        location: "Manhattan, NY",
        image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    8: {
        name: "Sofia Martinez",
        role: "Player",
        memberSince: "July 2023",
        gamesPlayed: "19",
        rating: "4.3/5.0",
        favoriteSport: "Volleyball",
        location: "Brooklyn, NY",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    9: {
        name: "Ryan Cooper",
        role: "Player",
        memberSince: "August 2023",
        gamesPlayed: "15",
        rating: "4.2/5.0",
        favoriteSport: "Tennis",
        location: "Queens, NY",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    10: {
        name: "Kevin Park",
        role: "Player",
        memberSince: "September 2023",
        gamesPlayed: "12",
        rating: "4.1/5.0",
        favoriteSport: "Soccer",
        location: "Bronx, NY",
        image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    11: {
        name: "Lisa Wang",
        role: "Player",
        memberSince: "October 2023",
        gamesPlayed: "18",
        rating: "4.6/5.0",
        favoriteSport: "Badminton",
        location: "Manhattan, NY",
        image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    12: {
        name: "James Brown",
        role: "Player",
        memberSince: "November 2023",
        gamesPlayed: "25",
        rating: "4.5/5.0",
        favoriteSport: "Basketball",
        location: "Brooklyn, NY",
        image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    13: {
        name: "Maya Patel",
        role: "Player",
        memberSince: "December 2023",
        gamesPlayed: "14",
        rating: "4.3/5.0",
        favoriteSport: "Tennis",
        location: "Queens, NY",
        image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    14: {
        name: "Daniel Kim",
        role: "Player",
        memberSince: "January 2024",
        gamesPlayed: "11",
        rating: "4.2/5.0",
        favoriteSport: "Volleyball",
        location: "Manhattan, NY",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    15: {
        name: "Grace Taylor",
        role: "Player",
        memberSince: "February 2024",
        gamesPlayed: "9",
        rating: "4.1/5.0",
        favoriteSport: "Soccer",
        location: "Bronx, NY",
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    16: {
        name: "Chris Anderson",
        role: "Player",
        memberSince: "March 2024",
        gamesPlayed: "7",
        rating: "4.0/5.0",
        favoriteSport: "Basketball",
        location: "Brooklyn, NY",
        image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    17: {
        name: "Amanda White",
        role: "Player",
        memberSince: "April 2024",
        gamesPlayed: "5",
        rating: "3.9/5.0",
        favoriteSport: "Tennis",
        location: "Queens, NY",
        image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    18: {
        name: "Tyler Davis",
        role: "Player",
        memberSince: "May 2024",
        gamesPlayed: "13",
        rating: "4.4/5.0",
        favoriteSport: "Volleyball",
        location: "Manhattan, NY",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: true,
        isHost: false
    },
    19: {
        name: "Olivia Garcia",
        role: "Player",
        memberSince: "June 2024",
        gamesPlayed: "8",
        rating: "4.0/5.0",
        favoriteSport: "Badminton",
        location: "Bronx, NY",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    },
    20: {
        name: "Nathan Miller",
        role: "Player",
        memberSince: "July 2024",
        gamesPlayed: "6",
        rating: "3.8/5.0",
        favoriteSport: "Soccer",
        location: "Brooklyn, NY",
        image: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isFriend: false,
        isHost: false
    }
};

// Global variables
let currentHost = 1;
let countdownInterval;
let timeRemaining = 6330; // 1 hour 45 minutes 30 seconds in seconds
let isEditingPrices = false;
let isPrivate = false;
let originalPrices = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializePlayerInteractions();
    initializeModal();
    initializeActionButtons();
    initializePriceEditing();
    initializePrivacyToggle();
    initializeScrolling();
    storeFriendStates();
    updateTotalAmount();
});

// Initialize horizontal scrolling
function initializeScrolling() {
    const scrollContainer = document.getElementById('playersScroll');
    const leftArrow = document.getElementById('scrollLeft');
    const rightArrow = document.getElementById('scrollRight');
    
    // Scroll amount per click
    const scrollAmount = 200;
    
    // Ensure arrows exist
    if (!leftArrow || !rightArrow || !scrollContainer) {
        console.error('Scroll elements not found');
        return;
    }
    
    leftArrow.addEventListener('click', (e) => {
        e.preventDefault();
        scrollContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });
    
    rightArrow.addEventListener('click', (e) => {
        e.preventDefault();
        scrollContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
    
    // Update arrow states based on scroll position
    function updateArrowStates() {
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const isAtStart = scrollContainer.scrollLeft <= 0;
        const isAtEnd = scrollContainer.scrollLeft >= maxScrollLeft - 5;
        
        leftArrow.disabled = isAtStart;
        rightArrow.disabled = isAtEnd;
        
        // Update arrow opacity
        leftArrow.style.opacity = isAtStart ? '0.3' : '1';
        rightArrow.style.opacity = isAtEnd ? '0.3' : '1';
    }
    
    // Listen for scroll events
    scrollContainer.addEventListener('scroll', updateArrowStates);
    
    // Initial update
    setTimeout(updateArrowStates, 100);
    
    // Update on window resize
    window.addEventListener('resize', () => {
        setTimeout(updateArrowStates, 100);
    });
    
    // Prevent any vertical scrolling on the container
    scrollContainer.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            // Convert vertical scroll to horizontal
            scrollContainer.scrollBy({
                left: e.deltaY,
                behavior: 'smooth'
            });
        }
    });
}

// Store original prices for canceling edits
function storeOriginalPrices() {
    originalPrices = {};
    document.querySelectorAll('.payment-input').forEach(input => {
        const playerId = input.dataset.player;
        originalPrices[playerId] = parseFloat(input.value);
    });
}

// Update total amount display
function updateTotalAmount() {
    let total = 0;
    document.querySelectorAll('.payment-input').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    document.getElementById('minimumAmount').textContent = (total * 0.2).toFixed(2);
}

// Countdown Timer Functions
function initializeCountdown() {
    updateCountdownDisplay();
    countdownInterval = setInterval(function() {
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            handleBookingExpired();
            return;
        }
        
        updateCountdownDisplay();
    }, 1000);
}

function updateCountdownDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    // Change color when time is running low (less than 30 minutes)
    const timerElement = document.getElementById('countdown');
    if (timeRemaining < 1800) { // 30 minutes
        timerElement.style.animation = 'pulse 1s infinite';
    }
}

function handleBookingExpired() {
    const paymentSection = document.querySelector('.payment-reminder');
    paymentSection.innerHTML = `
        <div class="timer-container">
            <div class="timer-icon">❌</div>
            <div class="timer-content">
                <h3 class="timer-title" style="color: #ff4757;">Booking Expired</h3>
                <p class="timer-message">
                    This booking has been automatically canceled due to insufficient payment within the time limit.
                </p>
            </div>
        </div>
    `;
    paymentSection.style.background = 'linear-gradient(135deg, #ff4757, #ff6b7a)';
    
    // Disable action buttons
    document.querySelector('.pay-btn').disabled = true;
    document.querySelector('.pay-btn').style.background = '#ccc';
    document.querySelector('.pay-btn').style.cursor = 'not-allowed';
}

// Privacy Toggle Functions
function initializePrivacyToggle() {
    const privacyToggle = document.getElementById('privacyToggle');
    const passwordSection = document.getElementById('passwordSection');
    const copyPasswordBtn = document.getElementById('copyPassword');
    
    privacyToggle.addEventListener('click', function() {
        isPrivate = !isPrivate;
        
        if (isPrivate) {
            this.innerHTML = '<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>';
            this.classList.add('private');
            passwordSection.style.display = 'block';
            showNotification('Room is now private. Password generated!', 'success');
        } else {
            this.innerHTML = '<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>';
            this.classList.remove('private');
            passwordSection.style.display = 'none';
            showNotification('Room is now public. Anyone can join!', 'info');
        }
    });
    
    copyPasswordBtn.addEventListener('click', function() {
        const password = document.getElementById('roomPassword').textContent;
        navigator.clipboard.writeText(password).then(() => {
            showNotification('Password copied to clipboard!', 'success');
            this.textContent = '✅ Copied';
            setTimeout(() => {
                this.innerHTML = '📋 Copy';
            }, 2000);
        }).catch(() => {
            showNotification('Failed to copy password', 'error');
        });
    });
}

// Price Editing Functions
function initializePriceEditing() {
    const editBtn = document.getElementById('editPricesBtn');
    const saveBtn = document.getElementById('savePricesBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    editBtn.addEventListener('click', enterEditMode);
    saveBtn.addEventListener('click', saveChanges);
    cancelBtn.addEventListener('click', cancelChanges);
    
    // Initialize input event listeners
    document.querySelectorAll('.payment-input').forEach(input => {
        input.addEventListener('input', updateTotalAmount);
    });
    
    storeOriginalPrices();
}

function enterEditMode() {
    isEditingPrices = true;
    storeOriginalPrices();
    
    // Show inputs, hide displays
    document.querySelectorAll('.payment-amount').forEach(amount => {
        amount.style.display = 'none';
    });
    
    document.querySelectorAll('.payment-input').forEach(input => {
        input.style.display = 'inline-block';
    });
    
    // Update button visibility
    document.getElementById('editPricesBtn').style.display = 'none';
    document.getElementById('savePricesBtn').style.display = 'inline-block';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    
    showNotification('Price editing mode enabled', 'info');
}

function saveChanges() {
    isEditingPrices = false;
    
    // Update displays with input values
    document.querySelectorAll('.payment-input').forEach(input => {
        const playerId = input.dataset.player;
        const value = parseFloat(input.value).toFixed(2);
        const amountDisplay = document.querySelector(`.payment-amount[data-player="${playerId}"] .amount-value`);
        amountDisplay.textContent = value;
    });
    
    exitEditMode();
    showNotification('Price changes saved successfully!', 'success');
}

function cancelChanges() {
    isEditingPrices = false;
    
    // Restore original values
    document.querySelectorAll('.payment-input').forEach(input => {
        const playerId = input.dataset.player;
        input.value = originalPrices[playerId];
    });
    
    exitEditMode();
    updateTotalAmount();
    showNotification('Price changes canceled', 'warning');
}

function exitEditMode() {
    // Hide inputs, show displays
    document.querySelectorAll('.payment-amount').forEach(amount => {
        amount.style.display = 'inline-block';
    });
    
    document.querySelectorAll('.payment-input').forEach(input => {
        input.style.display = 'none';
    });
    
    // Update button visibility
    document.getElementById('editPricesBtn').style.display = 'inline-block';
    document.getElementById('savePricesBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

// Friend Management Functions
function storeFriendStates() {
    // Initialize friend states based on data
    Object.keys(playersData).forEach(playerId => {
        const player = playersData[playerId];
        const friendBtn = document.querySelector(`[data-player="${playerId}"]`)?.closest('.player-card')?.querySelector('.friend-btn');
        
        if (friendBtn && player.isFriend) {
            friendBtn.classList.add('friends');
            friendBtn.innerHTML = '✅ Friends';
        }
    });
}

function toggleFriend(playerId) {
    const player = playersData[playerId];
    const friendBtn = document.querySelector(`[data-player="${playerId}"]`).closest('.player-card').querySelector('.friend-btn');
    
    if (player.isFriend) {
        // Remove friend
        player.isFriend = false;
        friendBtn.classList.remove('friends');
        friendBtn.innerHTML = '👥 Add Friend';
        showNotification(`Removed ${player.name} from friends`, 'warning');
    } else {
        // Add friend
        player.isFriend = true;
        friendBtn.classList.add('friends');
        friendBtn.innerHTML = '✅ Friends';
        showNotification(`Added ${player.name} as friend!`, 'success');
    }
}

// Player Interaction Functions
function initializePlayerInteractions() {
    const switchHostButtons = document.querySelectorAll('.switch-host-btn');
    const friendButtons = document.querySelectorAll('.friend-btn');
    
    switchHostButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                const playerCard = this.closest('.player-card');
                const playerImage = playerCard.querySelector('.player-image');
                const newHostId = parseInt(playerImage.dataset.player);
                
                switchHost(newHostId);
            }
        });
    });
    
    friendButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                const playerCard = this.closest('.player-card');
                const playerImage = playerCard.querySelector('.player-image');
                const playerId = parseInt(playerImage.dataset.player);
                
                toggleFriend(playerId);
            }
        });
    });
}

function switchHost(newHostId) {
    // Remove current host styling
    const currentHostCard = document.querySelector('.host-player');
    if (currentHostCard) {
        currentHostCard.classList.remove('host-player');
        const currentHostBadge = currentHostCard.querySelector('.host-badge');
        if (currentHostBadge) {
            currentHostBadge.remove();
        }
        
        // Reset current host button
        const currentHostButton = currentHostCard.querySelector('.switch-host-btn');
        currentHostButton.textContent = '👑 Make Host';
        currentHostButton.disabled = false;
        
        // Enable friend button for previous host
        const currentHostFriendBtn = currentHostCard.querySelector('.friend-btn');
        currentHostFriendBtn.disabled = false;
        currentHostFriendBtn.textContent = '👥 Add Friend';
    }
    
    // Add new host styling
    const newHostImage = document.querySelector(`[data-player="${newHostId}"]`);
    const newHostCard = newHostImage.closest('.player-card');
    
    newHostCard.classList.add('host-player');
    
    // Add host badge
    const hostBadge = document.createElement('div');
    hostBadge.className = 'host-badge';
    hostBadge.textContent = 'HOST (YOU)';
    newHostCard.appendChild(hostBadge);
    
    // Update button
    const newHostButton = newHostCard.querySelector('.switch-host-btn');
    newHostButton.textContent = '👤 You';
    newHostButton.disabled = true;
    
    // Disable friend button for new host
    const newHostFriendBtn = newHostCard.querySelector('.friend-btn');
    newHostFriendBtn.disabled = true;
    newHostFriendBtn.textContent = '👤 You';
    
    // Update player data
    playersData[currentHost].isHost = false;
    playersData[newHostId].isHost = true;
    currentHost = newHostId;
    
    // Show success message
    showNotification(`${playersData[newHostId].name} is now the host!`, 'success');
}

// Modal Functions
function initializeModal() {
    const modal = document.getElementById('playerModal');
    const closeBtn = document.getElementById('modalClose');
    const playerImages = document.querySelectorAll('.player-image');
    
    // Open modal when player image is clicked
    playerImages.forEach(image => {
        image.addEventListener('click', function() {
            const playerId = parseInt(this.dataset.player);
            openPlayerModal(playerId);
        });
    });
    
    // Close modal events
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

function openPlayerModal(playerId) {
    const player = playersData[playerId];
    const modal = document.getElementById('playerModal');
    
    // Populate modal with player data
    document.getElementById('modalPlayerImage').src = player.image;
    document.getElementById('modalPlayerName').textContent = player.name;
    document.getElementById('modalPlayerRole').textContent = player.role;
    document.getElementById('memberSince').textContent = player.memberSince;
    document.getElementById('gamesPlayed').textContent = player.gamesPlayed;
    document.getElementById('playerRating').textContent = player.rating;
    document.getElementById('favoriteSport').textContent = player.favoriteSport;
    document.getElementById('playerLocation').textContent = player.location;
    
    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1';
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('playerModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modal.style.opacity = '0';
    modalContent.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Action Button Functions
function initializeActionButtons() {
    const cancelBtn = document.querySelector('.cancel-btn');
    const payBtn = document.querySelector('.pay-btn');
    
    cancelBtn.addEventListener('click', handleCancelBooking);
    payBtn.addEventListener('click', handlePayNow);
}

function handleCancelBooking() {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        showNotification('Booking cancellation initiated...', 'warning');
        
        // Simulate cancellation process
        setTimeout(() => {
            showNotification('Booking has been successfully canceled.', 'success');
            
            // Disable all interactions
            const actionButtons = document.querySelectorAll('.cancel-btn, .pay-btn');
            actionButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
            
            // Stop countdown
            clearInterval(countdownInterval);
            
            // Update page status
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'status-banner';
            statusIndicator.innerHTML = '⚠️ This booking has been canceled';
            statusIndicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff4757;
                color: white;
                text-align: center;
                padding: 15px;
                font-weight: 600;
                z-index: 1001;
            `;
            document.body.prepend(statusIndicator);
        }, 2000);
    }
}

function handlePayNow() {
    showNotification('Redirecting to payment gateway...', 'info');
    
    // Simulate payment redirection
    setTimeout(() => {
        // In a real application, this would redirect to a payment processor
        alert('Payment gateway integration would be implemented here.\n\nThis would typically redirect to:\n- Stripe\n- PayPal\n- Square\n- Or other payment processors');
    }, 1500);
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styling
    const colors = {
        success: '#4CAF50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196F3'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1002;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Payment calculation functions (for future backend integration)
function calculatePlayerPayment(totalAmount, numberOfPlayers, playerId) {
    // Basic equal split - can be enhanced for custom payment distribution
    return totalAmount / numberOfPlayers;
}

function calculateMinimumPayment(totalAmount, percentage = 20) {
    return (totalAmount * percentage) / 100;
}

function redistributePayments(totalAmount, playerCount, customAmounts = {}) {
    // Function to handle custom payment redistribution
    // This would be used when the host wants to adjust individual payment amounts
    const baseAmount = totalAmount / playerCount;
    const redistributed = {};
    
    for (let i = 1; i <= playerCount; i++) {
        redistributed[i] = customAmounts[i] || baseAmount;
    }
    
    return redistributed;
}

// CSS Animation for pulsing timer
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .notification {
        font-family: 'Inter', sans-serif;
    }
    
    .modal-content {
        transform: translate(-50%, -50%) scale(0.8);
        transition: transform 0.3s ease;
    }
    
    .modal-overlay {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export functions for potential future use
window.BookingDetailsAPI = {
    switchHost,
    toggleFriend,
    calculatePlayerPayment,
    calculateMinimumPayment,
    redistributePayments,
    showNotification,
    enterEditMode,
    saveChanges,
    cancelChanges
};