fetchBookingDetails();

function fetchBookingDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get("booking_id");

  if (!bookingId) {
    showNotification("Missing booking ID in URL", "error");
    return;
  }

  fetch(`getBookingDetails.php?booking_id=${bookingId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showNotification(data.error, "error");
        return;
      }

      window.players = data.players; // ✅ set before using

      populateBookingDetails(data.booking);
      populatePlayerList(data.players);
      
      // ✅ now safe to call
      initializePrivacyToggle();
    })
    .catch(err => {
      console.error(err);
      showNotification("Failed to fetch booking details", "error");
    });
}



function populateBookingDetails(booking) {
  document.getElementById("venueName").textContent = booking.place_name;
  document.getElementById("venueLocation").textContent = booking.venue_location;
  document.getElementById("venueImage").src = booking.venue_image;
  document.getElementById("bookingDate").textContent = booking.booking_date;
  document.getElementById("bookingTime").textContent = booking.booking_time;
  document.getElementById("totalPrice").textContent = booking.total_price + " ₪";
  document.getElementById("bookingId").textContent = booking.booking_id;

  // store group id globally for later updates
  window.currentGroupId = booking.group_id;

  // ✅ عرض الخصوصية
  const privacyToggle = document.getElementById("privacyToggle");
  const passwordSection = document.getElementById("passwordSection");
  const roomPassword = document.getElementById("roomPassword");

  if (booking.privacy === "private") {
    window.isPrivate = true;
    privacyToggle.innerHTML = `<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>`;
    privacyToggle.classList.add("private");
    passwordSection.style.display = "block";
    roomPassword.textContent = booking.group_password;
  } else {
    window.isPrivate = false;
    privacyToggle.innerHTML = `<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>`;
    privacyToggle.classList.remove("private");
    passwordSection.style.display = "none";
  }
}


function populatePlayerList(players) {
  const container = document.getElementById("playersScroll");
  container.innerHTML = ""; // Clear old list

  players.forEach(p => {
    console.log("🎯 Adding player card", p.username);
    const isHost = p.is_host == "1";
    const isCurrentUser = p.username === currentUsername;

    const playerCard = document.createElement("div");
    playerCard.className = "player-card";

    // Add style class
    if (isHost) {
      playerCard.classList.add("host-player"); // Orange background for host
    } else if (isCurrentUser) {
      playerCard.classList.add("me-player"); // Green background for "me"
    }

    // Badge
    let badgeHTML = "";
    if (isHost && isCurrentUser) {
      badgeHTML = `<div class="host-badge">HOST (YOU)</div>`;
    } else if (isHost) {
      badgeHTML = `<div class="host-badge">HOST</div>`;
    } else if (isCurrentUser) {
      badgeHTML = `<div class="me-badge">ME</div>`;
    }

    // Buttons
    let buttonsHTML = "";
    if (!isCurrentUser && currentUsername === getHostUsername(players)) {
      buttonsHTML += `<button class="switch-host-btn">👑 Make Host</button>`;
    }
    if (!isCurrentUser) {
      const friendText = p.is_friend ? '🚫 Remove Friend' : '👥 Add Friend';
      const friendClass = p.is_friend ? 'remove-friend' : 'add-friend';
      buttonsHTML += `<button class="friend-btn ${friendClass}">${friendText}</button>`;
    }

    playerCard.innerHTML = `
      ${badgeHTML}
      <img class="player-image" src="${p.user_image}" alt="${p.username}" data-player="${p.username}">
      <div class="player-name">${p.username}</div>
      <div class="player-status">${p.paid_amount} / ${p.price}</div>
      <div class="payment-amount" data-player="${p.username}">
        <span class="amount-value">${p.price}</span> 
      </div>
      <input class="payment-input" data-player="${p.username}" style="display: none;" value="${p.price}" />
      <div class="player-actions">${buttonsHTML}</div>
    `;

    container.appendChild(playerCard);
  });

  // Show or hide host controls
  const hostControls = document.getElementById("hostControls");
  if (getHostUsername(players) === currentUsername) {
    hostControls.style.display = "flex";
  } else {
    hostControls.style.display = "none";
  }

  initializePlayerActions(); // Re-bind actions
}
function getHostUsername(players) {
  const host = players.find(p => p.is_host == "1");
  return host ? host.username : null;
}


document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ BookingDetails.js is loaded");
  
  // Initialize variables (move to global scope)
  window.isPrivate = false;
  window.isEditingPrices = false;
  window.timeRemaining = 6330; // 1:45:30
  window.originalPrices = {};
  window.currentHost = "1";
  
  // Initialize all functions
  initializePrivacyToggle();
  initializeScrolling();
  initializeEditPrices();
  initializePlayerActions();
  initializeActionButtons();
  startCountdown();
});

function initializePrivacyToggle() {
  const privacyToggle = document.getElementById('privacyToggle');
  const passwordSection = document.getElementById('passwordSection');
  const copyPasswordBtn = document.getElementById('copyPassword');

  // ✅ Ensure boolean
  const isHost = !!window.players?.find(p => p.username === currentUsername && p.is_host == "1");

  // If not host, disable
  if (!isHost) {
    privacyToggle.disabled = true;
    privacyToggle.style.cursor = "not-allowed";
    privacyToggle.style.opacity = "0.6";
    return;
  }

  // ✅ Host can toggle
  privacyToggle?.addEventListener('click', function () {
    window.isPrivate = !window.isPrivate;
    const newPrivacy = window.isPrivate ? 'private' : 'public';

    if (window.isPrivate) {
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

    // notify backend about the change
    if (window.currentGroupId) {
      const formData = new URLSearchParams();
      formData.append('group_id', window.currentGroupId);
      formData.append('privacy', newPrivacy);

      fetch('updatePrivacy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.password) {
              document.getElementById('roomPassword').textContent = data.password;
            }
          } else {
            showNotification(data.error || 'Failed to update privacy', 'error');
          }
        })
        .catch(() => {
          showNotification('Failed to update privacy', 'error');
        });
    }
  });

  copyPasswordBtn?.addEventListener('click', function () {
    const password = document.getElementById('roomPassword').textContent;
    navigator.clipboard.writeText(password).then(() => {
      showNotification('Password copied to clipboard!', 'success');
      this.textContent = '✅ Copied';
      setTimeout(() => {
        this.innerHTML = '📋 Copy';
      }, 2000);
    });
  });
}



function initializeScrolling() {
  const scrollContainer = document.getElementById('playersScroll');
  const leftArrow = document.getElementById('scrollLeft');
  const rightArrow = document.getElementById('scrollRight');
  const scrollAmount = 200;

  leftArrow?.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  rightArrow?.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  function updateArrowStates() {
    if (!scrollContainer) return;
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const isAtStart = scrollContainer.scrollLeft <= 0;
    const isAtEnd = scrollContainer.scrollLeft >= maxScrollLeft - 5;
    
    if (leftArrow) {
      leftArrow.disabled = isAtStart;
      leftArrow.style.opacity = isAtStart ? '0.3' : '1';
    }
    if (rightArrow) {
      rightArrow.disabled = isAtEnd;
      rightArrow.style.opacity = isAtEnd ? '0.3' : '1';
    }
  }

  scrollContainer?.addEventListener('scroll', updateArrowStates);
  setTimeout(updateArrowStates, 100);
}

function initializeEditPrices() {
  const editBtn = document.getElementById('editPricesBtn');
  const saveBtn = document.getElementById('savePricesBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');

  editBtn?.addEventListener('click', enterEditMode);
  saveBtn?.addEventListener('click', saveChanges);
  cancelBtn?.addEventListener('click', cancelChanges);
}

function initializePlayerActions() {
  document.querySelectorAll('.switch-host-btn').forEach((btn, index) => {
    btn.addEventListener('click', function() {
      // Since host player (index 0) has no switch-host-btn, we need to adjust
      const playerId = this.closest('.player-card').querySelector('.player-image').dataset.player;
      switchHost(playerId);
    });
  });

  document.querySelectorAll('.friend-btn').forEach((btn, index) => {
    if (!btn.disabled) { // Skip disabled buttons (host player)
      btn.addEventListener('click', function() {
        const playerId = this.closest('.player-card').querySelector('.player-image').dataset.player;
        toggleFriend(playerId);
      });
    }
  });
}

function initializeActionButtons() {
  document.querySelector('.pay-btn')?.addEventListener('click', handlePayNow);
  document.querySelector('.cancel-btn')?.addEventListener('click', handleCancelBooking);
}

function switchHost(newHostId) {
  const currentHostCard = document.querySelector('.host-player');
  if (currentHostCard) {
    currentHostCard.classList.remove('host-player');
    currentHostCard.querySelector('.host-badge')?.remove();
    
    // Add switch-host button back to old host
    const playerActions = currentHostCard.querySelector('.player-actions');
    const friendBtn = playerActions.querySelector('.friend-btn');
    
    if (!playerActions.querySelector('.switch-host-btn')) {
      const switchBtn = document.createElement('button');
      switchBtn.className = 'switch-host-btn';
      switchBtn.innerHTML = '👑 Make Host';
      switchBtn.addEventListener('click', function() {
        const playerId = this.closest('.player-card').querySelector('.player-image').dataset.player;
        switchHost(playerId);
      });
      playerActions.insertBefore(switchBtn, friendBtn);
    }
    
    friendBtn.disabled = false;
    friendBtn.classList.remove('remove-friend');
    friendBtn.classList.add('add-friend');
    friendBtn.textContent = '👥 Add Friend';
  }

  const newHostCard = document.querySelector(`[data-player="${newHostId}"]`).closest('.player-card');
  
  if (newHostCard) {
    newHostCard.classList.add('host-player');

    const hostBadge = document.createElement('div');
    hostBadge.className = 'host-badge';
    hostBadge.textContent = 'HOST (YOU)';
    newHostCard.appendChild(hostBadge);

    // Remove switch-host button and disable friend button
    const switchBtn = newHostCard.querySelector('.switch-host-btn');
    if (switchBtn) switchBtn.remove();
    
    const friendBtn = newHostCard.querySelector('.friend-btn');
    friendBtn.disabled = true;
    friendBtn.classList.remove('add-friend', 'remove-friend');
    friendBtn.textContent = '👤 You';

    showNotification('You are now the host!', 'success');
  }
}

function toggleFriend(playerId) {
  const friendBtn = document.querySelector(`[data-player="${playerId}"]`).closest('.player-card').querySelector('.friend-btn');
  const isRemove = friendBtn.classList.contains('remove-friend');

  if (isRemove) {
    friendBtn.classList.remove('remove-friend');
    friendBtn.classList.add('add-friend');
    friendBtn.textContent = '👥 Add Friend';
    showNotification('Removed from friends', 'warning');
  } else {
    friendBtn.classList.remove('add-friend');
    friendBtn.classList.add('remove-friend');
    friendBtn.textContent = '🚫 Remove Friend';
    showNotification('Added as friend!', 'success');
  }
}

function enterEditMode() {
  document.querySelectorAll('.payment-amount').forEach(amount => {
    window.originalPrices[amount.dataset.player] = amount.querySelector('.amount-value').textContent;
    amount.style.display = 'none';
  });
  
  document.querySelectorAll('.payment-input').forEach(input => input.style.display = 'inline-block');
  
  document.getElementById('editPricesBtn').style.display = 'none';
  document.getElementById('savePricesBtn').style.display = 'inline-block';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function saveChanges() {
  document.querySelectorAll('.payment-input').forEach(input => {
    const playerId = input.dataset.player;
    const value = parseFloat(input.value).toFixed(2);
    const amountDisplay = document.querySelector(`.payment-amount[data-player="${playerId}"] .amount-value`);
    amountDisplay.textContent = value;
  });
  exitEditMode();
  showNotification('Prices saved!', 'success');
}

function cancelChanges() {
  document.querySelectorAll('.payment-input').forEach(input => {
    input.value = window.originalPrices[input.dataset.player];
  });
  exitEditMode();
  showNotification('Changes canceled', 'warning');
}

function exitEditMode() {
  document.querySelectorAll('.payment-amount').forEach(amount => amount.style.display = 'inline-block');
  document.querySelectorAll('.payment-input').forEach(input => input.style.display = 'none');
  
  document.getElementById('editPricesBtn').style.display = 'inline-block';
  document.getElementById('savePricesBtn').style.display = 'none';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

function startCountdown() {
  setInterval(() => {
    if (window.timeRemaining > 0) {
      window.timeRemaining--;
      updateCountdownDisplay();
    }
  }, 1000);
}

function updateCountdownDisplay() {
  const hours = Math.floor(window.timeRemaining / 3600);
  const minutes = Math.floor((window.timeRemaining % 3600) / 60);
  const seconds = window.timeRemaining % 60;

  document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function handlePayNow() {
  showNotification('Redirecting to payment...', 'info');
  setTimeout(() => alert('Payment gateway would be here'), 1500);
}

function handleCancelBooking() {
  if (confirm('Cancel this booking?')) {
    showNotification('Booking canceled', 'warning');
  }
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

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
    background: ${colors[type]};
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
  setTimeout(() => notification.style.transform = 'translateX(0)', 10);
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}