// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ BookingDetails.js is loaded");
  
  // Initialize global variables
  window.isPrivate = false;
  window.isEditingPrices = false;
  window.timeRemaining = 6330; // 1:45:30
  window.originalPrices = {};
  window.players = [];
  window.currentGroupId = null;
  
  // Initialize UI components
  initializeScrolling();
  initializeEditPrices();
  
  // Fetch booking data first, then start countdown
  fetchBookingDetails();
});

function fetchBookingDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get("booking_id");

  if (!bookingId) {
    showNotification("Missing booking ID in URL", "error");
    return;
  }

  console.log("🔍 Fetching booking details for ID:", bookingId);

  fetch(`getBookingDetails.php?booking_id=${bookingId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("📊 Booking data received:", data);
      
      if (data.error) {
        showNotification(data.error, "error");
        return;
      }

        // Set global variables
  window.players = data.players || [];
  window.currentGroupId = data.booking?.group_id || null;
  window.currentBookingId = data.booking?.booking_id || null;
  window.totalVenuePrice = data.booking?.total_price || 0;
  window.countdownData = data.countdown || null;
  window.currentUserRole = data.current_user?.role || 'guest';

      // Debug countdown data
      console.log('🔍 Countdown data received:', window.countdownData);
      console.log('👤 Current user role:', window.currentUserRole);
      console.log('👤 Current user data:', data.current_user);
      
      // Populate UI
      populateBookingDetails(data.booking);
      populatePlayerList(data.players);
      
      // Initialize privacy toggle after data is loaded
      initializePrivacyToggle();
      
      // Initialize action buttons based on user role
      initializeActionButtons();
      
      // Start countdown timer with fetched data
      startCountdown();
    })
    .catch(err => {
      console.error("❌ Failed to fetch booking details:", err);
      showNotification("Failed to fetch booking details: " + err.message, "error");
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

  // ✅ Display privacy
  const privacyToggle = document.getElementById("privacyToggle");
  const passwordSection = document.getElementById("passwordSection");
  const roomPassword = document.getElementById("roomPassword");
  const roomPasswordInput = document.getElementById("roomPasswordInput");
  const editPasswordBtn = document.getElementById("editPasswordBtn");

  if (booking.privacy === "private") {
    window.isPrivate = true;
    privacyToggle.innerHTML = `<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>`;
    privacyToggle.classList.add("private");
    passwordSection.style.display = "block";
    roomPassword.textContent = booking.group_password;
    roomPasswordInput.value = booking.group_password;
    
    // Hide edit password button initially (will be shown in initializePrivacyToggle if user is host)
    if (editPasswordBtn) {
      editPasswordBtn.style.display = "none";
    }
  } else {
    window.isPrivate = false;
    privacyToggle.innerHTML = `<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>`;
    privacyToggle.classList.remove("private");
    passwordSection.style.display = "none";
    
    // Hide edit password button for public rooms
    if (editPasswordBtn) {
      editPasswordBtn.style.display = "none";
    }
  }
}


function populatePlayerList(players) {
  const container = document.getElementById("playersScroll");
  container.innerHTML = ""; // Clear old list

  // Remove duplicate players based on username
  const uniquePlayers = players.filter((player, index, self) => 
    index === self.findIndex(p => p.username === player.username)
  );

  uniquePlayers.forEach(p => {
    console.log("🎯 Adding player card", p.username);
    const isHost = p.is_host == "1";
    const isCurrentUser = p.username === window.currentUsername;

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
      badgeHTML = `<div class="host-badge">HOST (YOU)<br><small>🏦 20% Deposit Responsible</small></div>`;
    } else if (isHost) {
      badgeHTML = `<div class="host-badge">HOST<br><small>🏦 20% Deposit Responsible</small></div>`;
    } else if (isCurrentUser) {
      badgeHTML = `<div class="me-badge">ME</div>`;
    }

    // Buttons
    let buttonsHTML = "";
    if (!isCurrentUser && window.currentUsername === getHostUsername(uniquePlayers)) {
      buttonsHTML += `<button class="switch-host-btn">👑 Make Host</button>`;
    }
    if (!isCurrentUser) {
      buttonsHTML += `<button class="friend-btn">👥 Add Friend</button>`;
    }
    


    playerCard.innerHTML = `
      ${badgeHTML}
      <img class="player-image" src="${p.user_image}" alt="${p.username}" data-player="${p.username}">
      <div class="player-name">${p.username}</div>
      <div class="player-status">₪${p.payment_amount || 0}</div>
      <div class="payment-amount" data-player="${p.username}">
        <span class="amount-value">${p.required_payment || 0}</span> 
      </div>
      <input class="payment-input" data-player="${p.username}" style="display: none;" value="${p.required_payment || 0}" />
      <div class="player-actions">${buttonsHTML}</div>
    `;

    container.appendChild(playerCard);
  });

  // Show or hide host controls
  const hostControls = document.getElementById("hostControls");
  const currentHost = getHostUsername(uniquePlayers);
  
  console.log("🎯 Host controls check:", { currentUsername: window.currentUsername, currentHost, isHost: window.currentUsername === currentHost });
  
  if (currentHost === window.currentUsername) {
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


// Removed duplicate initialization - using the one at the top

function initializePrivacyToggle() {
  const privacyToggle = document.getElementById('privacyToggle');
  const passwordSection = document.getElementById('passwordSection');
  const copyPasswordBtn = document.getElementById('copyPassword');
  const editPasswordBtn = document.getElementById('editPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');

  if (!privacyToggle) {
    console.log("❌ Privacy toggle element not found");
    return;
  }

  // Check if current user is the host
  const currentUser = window.players?.find(p => p.username === window.currentUsername);
  const isHost = currentUser && currentUser.is_host == "1";

  console.log("🔍 Privacy toggle initialization:", { 
    currentUsername: window.currentUsername, 
    currentUser,
    isHost,
    playersCount: window.players?.length || 0
  });

  // Configure toggle based on host status
  if (!isHost) {
    console.log("❌ Not host - disabling privacy toggle");
    privacyToggle.disabled = true;
    privacyToggle.style.cursor = "not-allowed";
    privacyToggle.style.opacity = "0.6";
    privacyToggle.title = "Only the host can change privacy settings";
    
    // Hide edit password button for non-hosts
    if (editPasswordBtn) {
      editPasswordBtn.style.display = "none";
    }
    return;
  }

  console.log("✅ Is host - enabling privacy toggle");
  
  // Enable toggle for host
  privacyToggle.disabled = false;
  privacyToggle.style.cursor = "pointer";
  privacyToggle.style.opacity = "1";
  privacyToggle.title = "Click to toggle privacy";

  // Show edit password button for host (only when room is private)
  if (editPasswordBtn && window.isPrivate) {
    editPasswordBtn.style.display = "inline-block";
  }

  // Add click handler (remove existing first to prevent duplicates)
  privacyToggle.replaceWith(privacyToggle.cloneNode(true));
  const newToggle = document.getElementById('privacyToggle');
  
  newToggle.addEventListener('click', handlePrivacyToggle);

  // Initialize copy password button
  if (copyPasswordBtn) {
    copyPasswordBtn.addEventListener('click', function () {
      const passwordElement = document.getElementById('roomPassword');
      const passwordInput = document.getElementById('roomPasswordInput');
      const password = passwordElement.style.display === 'none' ? 
        passwordInput.value : passwordElement.textContent;
      
      if (password) {
        navigator.clipboard.writeText(password).then(() => {
          showNotification('Password copied to clipboard!', 'success');
          this.textContent = '✅ Copied';
          setTimeout(() => {
            this.innerHTML = '📋 Copy';
          }, 2000);
        }).catch(() => {
          showNotification('Failed to copy password', 'error');
        });
      }
    });
  }

  // Initialize password editing buttons (host only)
  if (isHost) {
    initializePasswordEditing();
  }
}

function handlePrivacyToggle(e) {
  e.preventDefault();
  e.stopPropagation();
  
  console.log("🔒 Privacy toggle clicked, current state:", window.isPrivate);
  
  const passwordSection = document.getElementById('passwordSection');
  const editPasswordBtn = document.getElementById('editPasswordBtn');
  const newPrivacy = window.isPrivate ? 'public' : 'private';
  
  // Update UI immediately for better UX
  window.isPrivate = !window.isPrivate;
  
  if (window.isPrivate) {
    this.innerHTML = '<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>';
    this.classList.add('private');
    passwordSection.style.display = 'block';
    
    // Show edit password button for host
    if (editPasswordBtn) {
      editPasswordBtn.style.display = 'inline-block';
    }
    
    showNotification('Room is now private!', 'success');
  } else {
    this.innerHTML = '<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>';
    this.classList.remove('private');
    passwordSection.style.display = 'none';
    
    // Hide edit password button when public
    if (editPasswordBtn) {
      editPasswordBtn.style.display = 'none';
    }
    
    showNotification('Room is now public!', 'info');
  }

  // Update backend
  updatePrivacyOnServer(newPrivacy);
}

function updatePrivacyOnServer(privacy) {
  if (!window.currentGroupId) {
    console.error("❌ No group ID available");
    showNotification('Error: No group ID found', 'error');
    return;
  }

  const formData = new URLSearchParams();
  formData.append('group_id', window.currentGroupId);
  formData.append('privacy', privacy);

  console.log("🔄 Updating privacy on server:", { groupId: window.currentGroupId, privacy });

  fetch('updatePrivacy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Privacy update response:", data);
    if (!data.success) {
      showNotification(data.error || 'Failed to update privacy', 'error');
      // Revert UI changes on failure
      window.isPrivate = !window.isPrivate;
      initializePrivacyToggle();
    } else {
      console.log("✅ Privacy updated successfully on server");
    }
  })
  .catch(error => {
    console.error("❌ Privacy update failed:", error);
    showNotification('Failed to update privacy: ' + error.message, 'error');
    // Revert UI changes on failure
    window.isPrivate = !window.isPrivate;
    initializePrivacyToggle();
  });
}

function initializePasswordEditing() {
  const editPasswordBtn = document.getElementById('editPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');

  // Remove existing listeners to prevent duplicates
  if (editPasswordBtn) {
    editPasswordBtn.replaceWith(editPasswordBtn.cloneNode(true));
    const newEditBtn = document.getElementById('editPasswordBtn');
    newEditBtn.addEventListener('click', handleEditPassword);
  }

  if (savePasswordBtn) {
    savePasswordBtn.replaceWith(savePasswordBtn.cloneNode(true));
    const newSaveBtn = document.getElementById('savePasswordBtn');
    newSaveBtn.addEventListener('click', handleSavePassword);
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.replaceWith(cancelPasswordBtn.cloneNode(true));
    const newCancelBtn = document.getElementById('cancelPasswordBtn');
    newCancelBtn.addEventListener('click', handleCancelPasswordEdit);
  }
}

function handleEditPassword() {
  console.log("✏️ Edit password clicked");
  
  const passwordElement = document.getElementById('roomPassword');
  const passwordInput = document.getElementById('roomPasswordInput');
  const editBtn = document.getElementById('editPasswordBtn');
  const saveBtn = document.getElementById('savePasswordBtn');
  const cancelBtn = document.getElementById('cancelPasswordBtn');

  // Switch to edit mode
  passwordInput.value = passwordElement.textContent;
  passwordElement.style.display = 'none';
  passwordInput.style.display = 'inline-block';
  passwordInput.readOnly = false;
  passwordInput.focus();
  passwordInput.select();

  // Show/hide buttons
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'inline-block';

  // Store original password for cancel functionality
  window.originalPassword = passwordElement.textContent;

  // Add keyboard support
  passwordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSavePassword();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelPasswordEdit();
    }
  });
}

function handleSavePassword() {
  if (!window.currentGroupId) {
    showNotification('Error: No group ID found', 'error');
    return;
  }

  const passwordInput = document.getElementById('roomPasswordInput');
  const newPassword = passwordInput.value.trim();

  if (!newPassword) {
    showNotification('Password cannot be empty', 'error');
    return;
  }

  if (newPassword.length < 4) {
    showNotification('Password must be at least 4 characters long', 'error');
    return;
  }

  console.log("💾 Saving password:", newPassword);

  // Show loading state
  const saveBtn = document.getElementById('savePasswordBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '⏳ Saving...';
  }

  // Call backend to save custom password
  const formData = new URLSearchParams();
  formData.append('group_id', window.currentGroupId);
  formData.append('action', 'save_custom_password');
  formData.append('password', newPassword);

  fetch('updatePrivacy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Save password response:", data);
    
    if (data.success) {
      // Update password display
      const passwordElement = document.getElementById('roomPassword');
      passwordElement.textContent = newPassword;
      exitPasswordEditMode();
      showNotification('Password saved successfully!', 'success');
    } else {
      throw new Error(data.error || 'Failed to save password');
    }
  })
  .catch(error => {
    console.error("❌ Save password failed:", error);
    showNotification('Failed to save password: ' + error.message, 'error');
  })
  .finally(() => {
    // Restore save button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 Save';
    }
  });
}

function handleCancelPasswordEdit() {
  console.log("❌ Cancel password edit");
  exitPasswordEditMode();
  showNotification('Password edit cancelled', 'info');
}

function exitPasswordEditMode() {
  const passwordElement = document.getElementById('roomPassword');
  const passwordInput = document.getElementById('roomPasswordInput');
  const editBtn = document.getElementById('editPasswordBtn');
  const saveBtn = document.getElementById('savePasswordBtn');
  const cancelBtn = document.getElementById('cancelPasswordBtn');

  // Switch back to display mode
  passwordElement.style.display = 'inline';
  passwordInput.style.display = 'none';
  passwordInput.readOnly = true;

  // Show/hide buttons
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  cancelBtn.style.display = 'none';
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
  console.log("🔧 Initializing action buttons...");
  console.log("👤 Current user role:", window.currentUserRole);
  console.log("👁️ View only mode:", window.viewOnly);
  
  // Hide action buttons if in view-only mode (from JoinGroup image click)
  if (window.viewOnly) {
    console.log("🚫 Hiding buttons due to view-only mode");
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
      actionButtons.style.display = 'none';
    }
    
    // Also hide payment reminder section in view-only mode
    const paymentSection = document.querySelector('.payment-section');
    if (paymentSection) {
      paymentSection.style.display = 'none';
    }
    
    // Update page title to indicate view-only mode
    document.title = 'View Booking Details - Book&Play';
    
    return;
  }
  
  // Get current user role from the fetched data
  const currentUserRole = window.currentUserRole || 'guest';
  console.log("🎭 Setting up buttons for role:", currentUserRole);
  
  const actionButtons = document.querySelector('.action-buttons');
  const payBtn = document.querySelector('.pay-btn');
  const cancelBtn = document.querySelector('.cancel-btn');
  
  console.log("🔍 Found elements:", {
    actionButtons: !!actionButtons,
    payBtn: !!payBtn,
    cancelBtn: !!cancelBtn
  });
  
  if (actionButtons && payBtn && cancelBtn) {
    // Make sure buttons are visible first
    actionButtons.style.display = 'flex';
    
    // Clear existing event listeners by cloning the buttons
    const newPayBtn = payBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    payBtn.parentNode.replaceChild(newPayBtn, payBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Set up buttons based on user role
    if (currentUserRole === 'host') {
      console.log("👑 Setting up HOST buttons");
      // Host sees "Cancel Booking" and "Pay Now"
      newCancelBtn.textContent = 'Cancel Booking';
      newCancelBtn.className = 'cancel-btn';
      newCancelBtn.addEventListener('click', handleCancelBooking);
      
      newPayBtn.textContent = 'Pay Now';
      newPayBtn.className = 'pay-btn';
      console.log("🔗 Adding click listener to Pay Now button (HOST)");
              newPayBtn.addEventListener('click', function(e) {
          console.log("🎯 Pay Now button clicked via event listener (HOST)");
          handlePayNow();
        });
      
    } else if (currentUserRole === 'member') {
      console.log("👥 Setting up MEMBER buttons");
      // Group member sees "Leave Group" and "Pay Now"
      newCancelBtn.textContent = 'Leave Group';
      newCancelBtn.className = 'leave-btn';
      newCancelBtn.addEventListener('click', handleLeaveGroup);
      
      newPayBtn.textContent = 'Pay Now';
      newPayBtn.className = 'pay-btn';
      console.log("🔗 Adding click listener to Pay Now button (MEMBER)");
              newPayBtn.addEventListener('click', function(e) {
          console.log("🎯 Pay Now button clicked via event listener (MEMBER)");
          handlePayNow();
        });
      
    } else {
      console.log("🚫 Hiding buttons for GUEST role");
      // Guest sees no action buttons
      actionButtons.style.display = 'none';
    }
  } else {
    console.error("❌ Could not find required button elements");
  }
}

function switchHost(newHostUsername) {
  if (!window.currentGroupId) {
    showNotification('Error: No group ID found', 'error');
    return;
  }

  console.log("👑 Switching host to:", newHostUsername);
  
  // Show loading state
  const switchBtn = document.querySelector(`[data-player="${newHostUsername}"]`)
    ?.closest('.player-card')?.querySelector('.switch-host-btn');
  
  if (switchBtn) {
    switchBtn.disabled = true;
    switchBtn.innerHTML = '⏳ Switching...';
  }

  // Call backend API
  const formData = new URLSearchParams();
  formData.append('group_id', window.currentGroupId);
  formData.append('username', newHostUsername);

  fetch('makeHost.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Switch host response:", data);
    
    if (data.success) {
      // Update local data
      window.players.forEach(player => {
        player.is_host = (player.username === newHostUsername) ? "1" : "0";
      });
      
      // Re-render player list to reflect changes
      populatePlayerList(window.players);
      
      // Re-initialize privacy toggle for new host
      initializePrivacyToggle();
      
      showNotification(`${newHostUsername} is now the host!`, 'success');
    } else {
      throw new Error(data.error || 'Failed to switch host');
    }
  })
  .catch(error => {
    console.error("❌ Switch host failed:", error);
    showNotification('Failed to switch host: ' + error.message, 'error');
    
    // Restore button state
    if (switchBtn) {
      switchBtn.disabled = false;
      switchBtn.innerHTML = '👑 Make Host';
    }
  });
}

function toggleFriend(playerId) {
  const friendBtn = document.querySelector(`[data-player="${playerId}"]`)
    ?.closest('.player-card')?.querySelector('.friend-btn');
  
  if (!friendBtn) return;

  const isFriend = friendBtn.classList.contains('friends');
  
  // Show loading state
  friendBtn.disabled = true;
  friendBtn.innerHTML = '⏳ Loading...';

  console.log("👥 Toggling friend status for:", playerId, "Current status:", isFriend);

  // Call friends API
  const action = isFriend ? 'remove_friend' : 'send_request';
  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('friend_username', playerId);

  fetch('../MyFriends/friends_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Friend action response:", data);
    
    if (data.success) {
      if (isFriend) {
        // Was friend, now removed
        friendBtn.classList.remove('friends');
        friendBtn.innerHTML = '👥 Add Friend';
        showNotification('Removed from friends', 'warning');
      } else {
        // Wasn't friend, now sent request
        friendBtn.classList.add('pending');
        friendBtn.innerHTML = '📤 Request Sent';
        showNotification('Friend request sent!', 'success');
      }
    } else {
      throw new Error(data.message || 'Friend action failed');
    }
  })
  .catch(error => {
    console.error("❌ Friend action failed:", error);
    showNotification('Failed to update friend status: ' + error.message, 'error');
    
    // Restore original state
    if (isFriend) {
      friendBtn.classList.add('friends');
      friendBtn.innerHTML = '✅ Friends';
    } else {
      friendBtn.classList.remove('friends', 'pending');
      friendBtn.innerHTML = '👥 Add Friend';
    }
  })
  .finally(() => {
    friendBtn.disabled = false;
  });
}

function enterEditMode() {
  document.querySelectorAll('.payment-amount').forEach(amount => {
    window.originalPrices[amount.dataset.player] = amount.querySelector('.amount-value').textContent;
    amount.style.display = 'none';
  });
  
  document.querySelectorAll('.payment-input').forEach(input => {
    input.style.display = 'inline-block';
    // Add real-time validation on input change
    input.addEventListener('input', validatePriceSum);
  });
  
  document.getElementById('editPricesBtn').style.display = 'none';
  document.getElementById('savePricesBtn').style.display = 'inline-block';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  
  // Add auto-balance button
  addAutoBalanceButton();
  
  // Reset validation state
  window.lastValidationState = false;
  
  // Initial validation
  validatePriceSum();
}

function saveChanges() {
  if (!window.currentGroupId) {
    showNotification('Error: No group ID found', 'error');
    return;
  }

  // Validate price sum before saving
  if (!validatePriceSum()) {
    showNotification('Cannot save: Sum of player prices must equal total venue price!', 'error');
    return;
  }

  // Collect all price changes
  const priceUpdates = [];
  document.querySelectorAll('.payment-input').forEach(input => {
    const username = input.dataset.player;
    const newPrice = parseFloat(input.value) || 0;
    const originalPrice = parseFloat(window.originalPrices[username]) || 0;
    
    if (newPrice !== originalPrice) {
      priceUpdates.push({ username, price: newPrice });
    }
  });

  if (priceUpdates.length === 0) {
    exitEditMode();
    showNotification('No changes to save', 'info');
    return;
  }

  console.log("💰 Saving price changes:", priceUpdates);

  // Show loading state
  const saveBtn = document.getElementById('savePricesBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '⏳ Saving...';
  }

  // Send updates to backend
  const promises = priceUpdates.map(update => {
    const formData = new URLSearchParams();
    formData.append('group_id', window.currentGroupId);
    formData.append('username', update.username);
    formData.append('price', update.price);

    console.log("💰 Updating price for", update.username, "to ₪" + update.price);
    console.log("📤 POST data:", {
      group_id: window.currentGroupId,
      username: update.username,
      price: update.price
    });

    return fetch('updatePlayerPrice.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.text(); // Get response as text first
    })
            .then(text => {
          console.log("📋 Raw response for", update.username + ":", text);
          try {
            const data = JSON.parse(text);
            if (!data.success) {
              // Don't treat "Price unchanged" as an error
              if (data.message && data.message.includes('unchanged')) {
                console.log("ℹ️ Price unchanged for", update.username);
                return { username: update.username, success: true, message: data.message };
              }
              throw new Error(data.error || 'Failed to update price');
            }
            return { username: update.username, success: true, message: data.message };
          } catch (parseError) {
            console.error("❌ JSON parse error for", update.username + ":", parseError);
            console.error("📋 Raw response was:", text);
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
          }
        });
  });

  Promise.all(promises)
    .then(results => {
      console.log("📊 Price update results:", results);
      
      // Update UI with new prices
      results.forEach(result => {
        if (result.success) {
          const input = document.querySelector(`[data-player="${result.username}"].payment-input`);
          const amountDisplay = document.querySelector(`.payment-amount[data-player="${result.username}"] .amount-value`);
          if (input && amountDisplay) {
            amountDisplay.textContent = parseFloat(input.value).toFixed(2);
          }
        }
      });
      
      exitEditMode();
      showNotification('Prices saved successfully!', 'success');
      
      // Refresh the booking details to show updated values
      setTimeout(() => {
        fetchBookingDetails();
      }, 500);
    })
    .catch(error => {
      console.error("❌ Price update failed:", error);
      showNotification('Failed to save prices: ' + error.message, 'error');
    })
    .finally(() => {
      // Restore save button
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
      }
    });
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
  document.querySelectorAll('.payment-input').forEach(input => {
    input.style.display = 'none';
    // Remove validation listeners
    input.removeEventListener('input', validatePriceSum);
  });
  
  document.getElementById('editPricesBtn').style.display = 'inline-block';
  document.getElementById('savePricesBtn').style.display = 'none';
  document.getElementById('cancelEditBtn').style.display = 'none';
  
  // Remove auto-balance button
  removeAutoBalanceButton();
  
  // Clear validation state
  window.lastValidationState = false;
}



function validatePriceSum() {
  const inputs = document.querySelectorAll('.payment-input');
  let sum = 0;
  let hasNonZeroValues = false;
  
  inputs.forEach(input => {
    const value = parseFloat(input.value) || 0;
    sum += value;
    if (value > 0) {
      hasNonZeroValues = true;
    }
  });
  
  const targetTotal = parseFloat(window.totalVenuePrice) || 0;
  const saveBtn = document.getElementById('savePricesBtn');
  
  // Calculate total paid by all members for smart validation
  const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
  const twentyPercentAmount = Math.round((targetTotal * 0.20) * 100) / 100;
  const needsInitialDeposit = totalPaidByAll < twentyPercentAmount;
  
  let isValid = false;
  let validationMessage = '';
  
  if (needsInitialDeposit) {
    // No one paid the 20% - sum must be >= 80% of total price
    const eightyPercentAmount = targetTotal * 0.8;
    isValid = Math.abs(sum - eightyPercentAmount) < 0.01; // Must equal exactly 80%
    validationMessage = `Sum must equal exactly ₪${eightyPercentAmount.toFixed(2)} (80% of total price)`;
  } else {
    // Someone paid the 20% - sum must equal remaining amount
    const remainingAmount = targetTotal - totalPaidByAll;
    isValid = Math.abs(sum - remainingAmount) < 0.01; // Allow small floating point differences
    validationMessage = `Sum must equal remaining amount: ₪${remainingAmount.toFixed(2)}`;
  }
  
  // Show success notification popup only if it wasn't valid before (first time achieving balance)
  if (isValid && hasNonZeroValues && !window.lastValidationState) {
    const successMessage = needsInitialDeposit 
      ? `✅ Perfect! Sum equals exactly 80%\nSum: ₪${sum.toFixed(2)} / Required: ₪${(targetTotal * 0.8).toFixed(2)}`
      : `✅ Perfect! Sum matches remaining amount\nSum: ₪${sum.toFixed(2)} / Remaining: ₪${(targetTotal - totalPaidByAll).toFixed(2)}`;
    
    showNotification(successMessage, 'success');
    window.lastValidationState = true;
  } else if (!isValid) {
    window.lastValidationState = false;
  }
  
  // Enable/disable save button based on validation
  // Only enforce validation if there are non-zero values
  if (saveBtn) {
    const shouldDisable = hasNonZeroValues && !isValid;
    saveBtn.disabled = shouldDisable;
    saveBtn.title = shouldDisable ? validationMessage : 'Save changes';
  }
  
  return !hasNonZeroValues || isValid; // Valid if no values entered OR sum matches requirements
}

function addAutoBalanceButton() {
  const hostControls = document.getElementById('hostControls');
  if (hostControls && !document.getElementById('autoBalanceBtn')) {
    const autoBalanceBtn = document.createElement('button');
    autoBalanceBtn.id = 'autoBalanceBtn';
    autoBalanceBtn.className = 'auto-balance-btn';
    autoBalanceBtn.innerHTML = '⚖️ Smart Split';
    autoBalanceBtn.title = 'Smart price distribution based on payment status';
    autoBalanceBtn.addEventListener('click', autoBalancePrices);
    
    // Insert before save button
    const saveBtn = document.getElementById('savePricesBtn');
    hostControls.insertBefore(autoBalanceBtn, saveBtn);
  }
}

function removeAutoBalanceButton() {
  const autoBalanceBtn = document.getElementById('autoBalanceBtn');
  if (autoBalanceBtn) {
    autoBalanceBtn.remove();
  }
}

function autoBalancePrices() {
  const inputs = document.querySelectorAll('.payment-input');
  const totalPrice = parseFloat(window.totalVenuePrice) || 0;
  const playerCount = inputs.length;
  
  if (playerCount === 0) {
    showNotification('No players to balance prices for', 'warning');
    return;
  }
  
  // Calculate total paid by all members
  const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
  const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100;
  const needsInitialDeposit = totalPaidByAll < twentyPercentAmount;
  
  console.log("💰 Smart price splitting analysis:", {
    totalPrice,
    totalPaidByAll,
    twentyPercentAmount,
    needsInitialDeposit
  });
  
  let pricePerPlayer;
  let message;
  
  if (needsInitialDeposit) {
    // No one paid the 20% - distribute 80% of total price among all players
    // Host pays less share since they're responsible for the 20% deposit
    const eightyPercentAmount = totalPrice * 0.8;
    const hostUsername = getHostUsername(window.players);
    
    // Calculate prices for each player
    inputs.forEach(input => {
      const playerUsername = input.dataset.player;
      if (playerUsername === hostUsername) {
        // Host pays 30% of the 80% (so they pay less share)
        const hostShare = eightyPercentAmount * 0.3;
        input.value = hostShare; // Removed .toFixed(2)
      } else {
        // Other players pay 70% of the 80% divided among them
        const nonHostCount = playerCount - 1;
        const nonHostShare = (eightyPercentAmount * 0.7) / nonHostCount;
        input.value = nonHostShare; // Removed .toFixed(2)
      }
    });
    
    message = `Smart split (20% not paid): Host pays ₪${eightyPercentAmount * 0.3} + 20% deposit, others pay ₪${(eightyPercentAmount * 0.7) / (playerCount - 1)}`;
    
    // Reset validation state and trigger validation
    window.lastValidationState = false;
    validatePriceSum();
    
    // Show the smart auto-balance confirmation
    setTimeout(() => {
      showNotification(message, 'info');
    }, 500);
    
    return; // Exit early since we've handled the distribution
  } else {
    // Someone paid the 20% - distribute remaining amount
    const remainingAmount = totalPrice - totalPaidByAll;
    pricePerPlayer = remainingAmount / playerCount;
    message = `Smart split (20% paid): ₪${pricePerPlayer} per player (Remaining: ₪${remainingAmount})`;
  }
  
  console.log(`💰 Smart auto-balancing: ${message}`);
  
  inputs.forEach(input => {
    input.value = pricePerPlayer; // Removed .toFixed(2)
  });
  
  // Reset validation state so the success popup will show
  window.lastValidationState = false;
  
  // Trigger validation (this will show the success popup)
  validatePriceSum();
  
  // Show the smart auto-balance confirmation
  setTimeout(() => {
    showNotification(message, 'info');
  }, 500);
}

function calculateCountdownDeadline() {
  // Get booking date and time from the page
  const bookingDate = document.getElementById('bookingDate').textContent;
  const bookingTime = document.getElementById('bookingTime').textContent;
  
  if (!bookingDate || !bookingTime) {
    console.log('❌ No booking date/time found');
    return null;
  }
  
  // Parse booking date and time
  const [startTime] = bookingTime.split(' - '); // Get start time only
  const deadlineDate = new Date(`${bookingDate} ${startTime}`);
  
  // Subtract 24 hours (1 day) from the booking time
  deadlineDate.setDate(deadlineDate.getDate() - 1);
  
  console.log('📅 Booking date/time:', `${bookingDate} ${startTime}`);
  console.log('⏰ Deadline date/time:', deadlineDate.toLocaleString());
  
  return deadlineDate;
}

function startCountdown() {
  console.log('🚀 startCountdown() called');
  
  // Check if full payment is already made
  const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
  const isFullyPaid = totalPaidByAll >= window.totalVenuePrice;
  
  if (isFullyPaid) {
    console.log('✅ Full payment made - disabling countdown timer');
    disableCountdownTimer();
    return;
  }
  
  // Calculate deadline (24 hours before booking)
  const deadlineDate = calculateCountdownDeadline();
  
  if (!deadlineDate) {
    console.log('❌ Could not calculate deadline - using fallback');
    window.timeRemaining = 6330; // Default fallback
  } else {
    // Calculate seconds remaining until deadline
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    window.timeRemaining = Math.max(0, Math.floor(timeDiff / 1000));
    
    console.log(`⏰ Countdown deadline: ${deadlineDate.toLocaleString()}`);
    console.log(`⏰ Seconds remaining: ${window.timeRemaining}`);
  }
  
  // Initialize countdown variables
  window.countdownPhase = 1;
  window.twentyPercentAmount = Math.round((window.totalVenuePrice * 0.20) * 100) / 100;
  window.totalPaid = totalPaidByAll;
  window.paymentDeadlineMet = totalPaidByAll >= window.twentyPercentAmount;
  
  console.log(`⏰ Starting countdown - Phase ${window.countdownPhase}, ${window.timeRemaining} seconds remaining`);
  console.log(`💰 Twenty percent amount: ₪${window.twentyPercentAmount}, Total paid: ₪${window.totalPaid}`);
  
  // Update display immediately
  updateCountdownDisplay();
  
  // Start the countdown interval
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval); // Clear any existing interval
  }
  
  window.countdownInterval = setInterval(() => {
    if (window.timeRemaining > 0) {
      window.timeRemaining--;
      updateCountdownDisplay();
    } else {
      // Countdown expired - handle deadline
      handleCountdownExpired();
    }
  }, 1000);
}

function disableCountdownTimer() {
  // Stop the countdown interval
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval);
  }
  
  // Update timer display to show payment complete
  const timerTitle = document.querySelector('.timer-title');
  const timerMessage = document.querySelector('.timer-message');
  const countdownTimer = document.getElementById('countdown');
  
  if (timerTitle) timerTitle.textContent = '✅ Payment Complete';
  if (timerMessage) {
    timerMessage.innerHTML = `
      <div class="payment-complete">
        <div class="success-message">🎉 Full payment has been completed!</div>
        <div class="payment-info">Total paid: <strong>₪${window.totalVenuePrice}</strong></div>
        <div class="booking-confirmed">Your booking is confirmed and ready.</div>
      </div>
    `;
  }
  
  // Hide the countdown timer
  if (countdownTimer) {
    countdownTimer.style.display = 'none';
  }
}

function updateCountdownDisplay() {
  const days = Math.floor(window.timeRemaining / 86400);
  const hours = Math.floor((window.timeRemaining % 86400) / 3600);
  const minutes = Math.floor((window.timeRemaining % 3600) / 60);
  const seconds = window.timeRemaining % 60;


  // Update countdown elements
  const hoursElement = document.getElementById('hours');
  const minutesElement = document.getElementById('minutes');
  const secondsElement = document.getElementById('seconds');
 
  
  if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
  if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
  if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
  
  // Update countdown message based on phase
  updateCountdownMessage(days, hours, minutes, seconds);
}

function updateCountdownMessage(days, hours, minutes, seconds) {
  const timerTitle = document.querySelector('.timer-title');
  const timerMessage = document.querySelector('.timer-message');
  const minimumAmount = document.getElementById('minimumAmount');
  
  if (!timerTitle || !timerMessage) {
    console.log('❌ Timer elements not found');
    return;
  }
  
  // Check if full payment is made
  const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
  const isFullyPaid = totalPaidByAll >= window.totalVenuePrice;
  
  if (isFullyPaid) {
    timerTitle.textContent = '✅ Payment Complete';
    timerMessage.innerHTML = `
      <div class="payment-complete">
        <div class="success-message">🎉 Full payment has been completed!</div>
        <div class="payment-info">Total paid: <strong>₪${window.totalVenuePrice}</strong></div>
        <div class="booking-confirmed">Your booking is confirmed and ready.</div>
      </div>
    `;
    return;
  }
  
  if (window.countdownPhase === 1) {
    // Phase 1: Need to pay 20%
    timerTitle.textContent = '⏰ Payment Deadline';
    if (minimumAmount) {
      minimumAmount.textContent = window.twentyPercentAmount;
    }
    
    timerMessage.innerHTML = `
      You must pay at least <strong>20% (₪<span id="minimumAmount">${window.twentyPercentAmount}</span>)</strong> of the total booking price before 24 hours prior to your booking time, otherwise the booking will be automatically canceled.
      <br><br>
      <div class="payment-status">
        <span class="current-paid">Currently paid: <strong>₪${window.totalPaid}</strong></span>
      </div>
    `;
  } else if (window.countdownPhase === 2) {
    // Phase 2: Need full payment
    timerTitle.textContent = '⏰ Full Payment Required';
    const remaining = window.totalVenuePrice - window.totalPaid;
    
    timerMessage.innerHTML = `
      <div class="phase-2-message">
        <div class="success-message">✅ 20% deposit requirement met!</div>
        <div class="full-payment-requirement">
          Complete full payment of <strong>₪${window.totalVenuePrice}</strong> before 24 hours prior to your booking time.
        </div>
        <div class="payment-status">
          <span class="current-paid">Currently paid: <strong>₪${window.totalPaid}</strong></span>
          <span class="remaining-amount">Remaining: <strong>₪${remaining.toFixed(2)}</strong></span>
        </div>
      </div>
    `;
  }
}

function handleCountdownExpired() {
  console.log(`⏰ Countdown expired for phase ${window.countdownPhase}`);
  
  // Stop the countdown
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval);
  }
  
  // Show expiration message
  const timerMessage = document.querySelector('.timer-message');
  if (timerMessage) {
    if (window.countdownPhase === 1) {
      timerMessage.innerHTML = `
        <div class="countdown-expired">
          <div class="countdown-expired-title">⚠️ Payment Deadline Expired</div>
          <div class="countdown-expired-message">The booking will be cancelled automatically due to insufficient payment.</div>
          <div class="countdown-expired-info">Required: ₪${window.twentyPercentAmount} | Paid: ₪${window.totalPaid}</div>
        </div>
      `;
    } else if (window.countdownPhase === 2) {
      timerMessage.innerHTML = `
        <div class="countdown-expired">
          <div class="countdown-expired-title">⚠️ Payment Deadline Expired</div>
          <div class="countdown-expired-message">Full payment was not completed in time.</div>
          <div class="countdown-expired-info">Required: ₪${window.totalVenuePrice} | Paid: ₪${window.totalPaid}</div>
        </div>
      `;
    }
  }
  
  // Check payment status and potentially cancel booking
  setTimeout(() => {
    checkPaymentStatusAndCancel();
  }, 2000);
}

function checkPaymentStatusAndCancel() {
  // This would typically make an API call to check current payment status
  // and handle cancellation if needed
  fetch('checkPaymentStatus.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `booking_id=${window.currentBookingId}&group_id=${window.currentGroupId}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.should_cancel) {
      showNotification('Booking cancelled due to payment deadline', 'error');
      // Redirect or refresh page
      setTimeout(() => {
        window.location.href = '../HomePage/HomePage.php';
      }, 3000);
    }
  })
  .catch(error => {
    console.error('❌ Error checking payment status:', error);
  });
}

function handlePayNow() {
  console.log("🎯 PAY NOW BUTTON CLICKED!");
  console.log("💳 Opening payment modal...");
  console.log("👤 Current username:", window.currentUsername);
  console.log("👥 Players data:", window.players);
  console.log("💰 Total venue price:", window.totalVenuePrice);
  console.log("🔍 Current URL:", window.location.href);
  
  openPaymentModal();
}

function openPaymentModal() {
  console.log("🎯 openPaymentModal function called!");
  console.log("🔍 Looking for payment modal elements...");
  const modal = document.getElementById('paymentModal');
  const closeBtn = document.getElementById('paymentModalClose');
  const cancelBtn = document.getElementById('cancelPayment');
  const confirmBtn = document.getElementById('confirmPayment');
  const payInitialCheckbox = document.getElementById('payInitialDeposit');
  
  console.log("🔍 Modal elements found:", {
    modal: !!modal,
    closeBtn: !!closeBtn,
    cancelBtn: !!cancelBtn,
    confirmBtn: !!confirmBtn,
    payInitialCheckbox: !!payInitialCheckbox
  });
  
  if (!modal) {
    console.error("❌ Payment modal not found!");
    showNotification("Payment modal not found. Please refresh the page.", "error");
    return;
  }
  
  console.log("🔍 Modal element details:");
  console.log("  - Modal element:", modal);
  console.log("  - Modal ID:", modal.id);
  console.log("  - Modal classes:", modal.className);
  console.log("  - Modal parent:", modal.parentElement);
  console.log("  - Modal in document:", document.contains(modal));
  
  // Populate modal with payment data
  populatePaymentModal();
  
  // Show modal with proper visibility
  modal.style.display = 'flex';
  modal.style.zIndex = '9999';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.visibility = 'visible';
  modal.style.pointerEvents = 'auto';
  
  // Force modal content to be visible
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.display = 'block';
    modalContent.style.zIndex = '10000';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '12px';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.transform = 'translate(-50%, -50%) scale(1)'; // Force scale to 1
    modalContent.style.position = 'absolute';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.visibility = 'visible';
    modalContent.style.opacity = '1';
  }
  
  // Use setTimeout to ensure the modal is visible after display is set
  setTimeout(() => {
    modal.style.opacity = '1'; // Force opacity to 1
    console.log("🔍 Modal opacity set to 1");
    console.log("🔍 Final modal style:", {
      display: modal.style.display,
      opacity: modal.style.opacity,
      zIndex: modal.style.zIndex,
      visibility: modal.style.visibility,
      position: modal.style.position
    });
  }, 10);
  
  console.log("✅ Payment modal displayed with forced visibility");
  console.log("🔍 Modal display style:", modal.style.display);
  console.log("🔍 Modal z-index:", modal.style.zIndex);
  console.log("🔍 Modal position:", modal.style.position);
  
  // Check modal content
  console.log("🔍 Modal content found:", !!modalContent);
  if (modalContent) {
    console.log("🔍 Modal content display:", modalContent.style.display);
    console.log("🔍 Modal content z-index:", modalContent.style.zIndex);
    console.log("🔍 Modal content background:", modalContent.style.backgroundColor);
    console.log("🔍 Modal content transform:", modalContent.style.transform);
  }
  
  // Event listeners
  closeBtn.onclick = closePaymentModal;
  cancelBtn.onclick = closePaymentModal;
  confirmBtn.onclick = handleConfirmPayment;
  
  // Close modal when clicking outside
  modal.onclick = function(e) {
    if (e.target === modal) {
      closePaymentModal();
    }
  };
  
  // Handle initial deposit checkbox change
  payInitialCheckbox.onchange = function() {
    updatePaymentAmount();
  };
  
  // Show host responsibility notification
  const hostUsername = getHostUsername(window.players);
  const isHost = window.currentUsername === hostUsername;
  if (isHost) {
    const totalPrice = window.totalVenuePrice || 0;
    const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100; // Keep 2 decimal places like backend
    showNotification(`As the host, you are responsible for the 20% deposit (₪${twentyPercentAmount}) to secure this booking.`, 'info');
  }
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'none';
    modal.style.opacity = '0'; // Reset opacity
  }
}

function populatePaymentModal() {
  console.log("💰 Populating payment modal...");
  
  // Get current user's payment data
  const currentUser = window.players.find(p => p.username === window.currentUsername);
  console.log("👤 Current user data:", currentUser);
  
  const totalPrice = window.totalVenuePrice || 0;
  const requiredPayment = currentUser?.required_payment || 0;
  const amountPaid = currentUser?.payment_amount || 0;
  const amountToPay = requiredPayment - amountPaid;
  
  console.log("💰 Payment calculations:", {
    totalPrice,
    requiredPayment,
    amountPaid,
    amountToPay
  });
  
  // Calculate total paid by all members
  const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
  const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100; // Keep 2 decimal places like backend
  const needsInitialDeposit = totalPaidByAll < twentyPercentAmount;
  
  console.log("💰 Group payment data:", {
    totalPaidByAll,
    twentyPercentAmount,
    needsInitialDeposit
  });
  
  // Populate modal fields
  const totalPriceElement = document.getElementById('modalTotalPrice');
  const requiredPaymentElement = document.getElementById('modalRequiredPayment');
  const amountPaidElement = document.getElementById('modalAmountPaid');
  const amountToPayElement = document.getElementById('modalAmountToPay');
  const initialDepositElement = document.getElementById('modalInitialDeposit');
  
  console.log("🔍 Modal field elements:", {
    totalPriceElement: !!totalPriceElement,
    requiredPaymentElement: !!requiredPaymentElement,
    amountPaidElement: !!amountPaidElement,
    amountToPayElement: !!amountToPayElement,
    initialDepositElement: !!initialDepositElement
  });
  
  if (totalPriceElement) totalPriceElement.textContent = totalPrice;
  if (requiredPaymentElement) requiredPaymentElement.textContent = requiredPayment;
  if (amountPaidElement) amountPaidElement.textContent = amountPaid;
  if (amountToPayElement) amountToPayElement.textContent = amountToPay;
  if (initialDepositElement) initialDepositElement.textContent = twentyPercentAmount;
  
  // Show/hide initial deposit section
  const initialPaymentSection = document.getElementById('initialPaymentSection');
  if (initialPaymentSection) {
    if (needsInitialDeposit) {
      initialPaymentSection.style.display = 'block';
      
      // Get host information
      const hostUsername = getHostUsername(window.players);
      const isHost = window.currentUsername === hostUsername;
      
      // Update the message based on user role
      let message;
      if (isHost) {
        message = 'As the host, you are responsible for paying the initial 20% deposit to secure the booking.';
      } else {
        message = 'The host needs to pay the initial 20% deposit. You can contribute if they haven\'t paid yet.';
      }
      
      const messageElement = initialPaymentSection.querySelector('p');
      if (messageElement) messageElement.textContent = message;
      
      // Auto-check the deposit checkbox for host and update label
      const payInitialCheckbox = document.getElementById('payInitialDeposit');
      const checkboxLabel = document.querySelector('label[for="payInitialDeposit"]');
      
      if (payInitialCheckbox) {
        if (isHost) {
          payInitialCheckbox.checked = true;
          // Trigger the change event to update payment amount
          payInitialCheckbox.dispatchEvent(new Event('change'));
          
          // Update label for host
          if (checkboxLabel) {
            checkboxLabel.innerHTML = `Pay the initial 20% deposit (₪<span id="modalInitialDeposit">${twentyPercentAmount}</span>) <strong>- Your Responsibility as Host</strong>`;
          }
        } else {
          // Update label for non-host
          if (checkboxLabel) {
            checkboxLabel.innerHTML = `Contribute to the initial 20% deposit (₪<span id="modalInitialDeposit">${twentyPercentAmount}</span>)`;
          }
        }
      }
    } else {
      initialPaymentSection.style.display = 'none';
    }
  }
  
  // Update payment amount based on checkbox
  updatePaymentAmount();
  console.log("✅ Payment modal populated");
}

function updatePaymentAmount() {
  const payInitialCheckbox = document.getElementById('payInitialDeposit');
  const amountToPayElement = document.getElementById('modalAmountToPay');
  const currentUser = window.players.find(p => p.username === window.currentUsername);
  const requiredPayment = currentUser?.required_payment || 0;
  const amountPaid = currentUser?.payment_amount || 0;
  const baseAmountToPay = requiredPayment - amountPaid;
  
  if (payInitialCheckbox.checked) {
    const totalPrice = window.totalVenuePrice || 0;
    const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100; // Keep 2 decimal places like backend
    const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
    const remainingInitialDeposit = Math.max(0, twentyPercentAmount - totalPaidByAll);
    
    amountToPayElement.textContent = baseAmountToPay + remainingInitialDeposit;
  } else {
    amountToPayElement.textContent = baseAmountToPay;
  }
}

function handleConfirmPayment() {
  console.log("💳 Starting payment confirmation...");
  
  const confirmBtn = document.getElementById('confirmPayment');
  const payInitialCheckbox = document.getElementById('payInitialDeposit');
  
  if (!confirmBtn) {
    console.error("❌ Confirm button not found!");
    return;
  }
  
  // Show loading state
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';
  
  // Prepare payment data
  const paymentData = {
    group_id: window.currentGroupId,
    booking_id: window.currentBookingId,
    pay_initial_deposit: payInitialCheckbox ? payInitialCheckbox.checked : false,
    payment_method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'credit'
  };
  
  console.log("💳 Processing payment:", paymentData);
  console.log("🔗 API URL: process_payment.php");
  
  // Call payment API
  console.log("🔗 Making fetch request to: ./process_payment.php");
  fetch('./process_payment.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  })
  .then(res => {
    console.log("📡 Response status:", res.status);
    console.log("📡 Response headers:", res.headers);
    console.log("📡 Response URL:", res.url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Payment response:", data);
    
    if (data.success) {
      showNotification(data.message, 'success');
      closePaymentModal();
      
      // Refresh booking details to show updated payment status
      setTimeout(() => {
        fetchBookingDetails();
      }, 1000);
    } else {
      throw new Error(data.error || 'Payment failed');
    }
  })
  .catch(error => {
    console.error("❌ Payment failed:", error);
    showNotification('Payment failed: ' + error.message, 'error');
    
    // Restore button state
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Payment';
    }
  });
}

function handleCancelBooking() {
  if (!window.currentBookingId) {
    showNotification('Error: No booking ID found', 'error');
    return;
  }

  // Show confirmation dialog with more details
  if (!confirm('Are you sure you want to cancel this booking?\n\nThis action will:\n• Delete the booking permanently\n• Remove all group members\n• Send refund notifications to all players\n• This action cannot be undone.')) {
    return;
  }

  console.log("🚫 Cancelling booking:", window.currentBookingId);
  
  // Show loading state
  const cancelBtn = document.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.disabled = true;
    cancelBtn.textContent = 'Cancelling...';
  }

  // Call backend API
  const formData = new URLSearchParams();
  formData.append('booking_id', window.currentBookingId);

  fetch('cancel_booking.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Cancel booking response:", data);
    
    if (data.success) {
      showNotification(data.message, 'success');
      
      // Show success message with details
      const successMessage = `Booking cancelled successfully!\n\nVenue: ${data.cancelled_booking.venue_name}\nMembers notified: ${data.cancelled_booking.members_notified}\n\nAll players will receive refund emails.`;
      alert(successMessage);
      
      // Redirect to MyBookings page after a short delay
      setTimeout(() => {
        window.location.href = '../MyBookings/MyBookings.php';
      }, 2000);
    } else {
      throw new Error(data.message || 'Failed to cancel booking');
    }
  })
  .catch(error => {
    console.error("❌ Cancel booking failed:", error);
    showNotification('Failed to cancel booking: ' + error.message, 'error');
    
    // Restore button state
    if (cancelBtn) {
      cancelBtn.disabled = false;
      cancelBtn.textContent = 'Cancel Booking';
    }
  });
}

function handleLeaveGroup() {
  if (!window.currentGroupId) {
    showNotification('Error: No group ID found', 'error');
    return;
  }

  // Show confirmation dialog
  if (!confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
    return;
  }

  console.log("👋 Leaving group:", window.currentGroupId);
  
  // Show loading state
  const leaveBtn = document.querySelector('.leave-btn');
  if (leaveBtn) {
    leaveBtn.disabled = true;
    leaveBtn.textContent = 'Leaving...';
  }

  // Call backend API
  const formData = new URLSearchParams();
  formData.append('group_id', window.currentGroupId);

  fetch('leave_group_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("📊 Leave group response:", data);
    
    if (data.success) {
      showNotification(data.message, 'success');
      // Redirect to JoinGroup page after a short delay
      setTimeout(() => {
        window.location.href = '../JoinGroup/JoinGroup.php';
      }, 1500);
    } else {
      throw new Error(data.error || 'Failed to leave group');
    }
  })
  .catch(error => {
    console.error("❌ Leave group failed:", error);
    showNotification('Failed to leave group: ' + error.message, 'error');
    
    // Restore button state
    if (leaveBtn) {
      leaveBtn.disabled = false;
      leaveBtn.textContent = 'Leave Group';
    }
  });
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

// ✅ View Booking Details (for image clicks)
function viewBookingDetails(booking_id) {
  const url = `../BookingDetails/BookingDetails.php?booking_id=${encodeURIComponent(booking_id)}&view_only=true`;
  window.location.href = url;
}

// ✅ Go back function
function goBack() {
  if (window.viewOnly) {
    // If in view-only mode, go back to JoinGroup
    window.location.href = '../JoinGroup/JoinGroup.php';
  } else {
    // Otherwise, go back to previous page
    window.history.back();
  }
}