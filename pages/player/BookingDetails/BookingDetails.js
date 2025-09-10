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
  window.phase2Transitioned = false; // Flag to prevent refresh from overriding Phase 2
  
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
      
      // Only start countdown if we haven't manually transitioned to Phase 2
      if (!window.phase2Transitioned) {
        startCountdown();
      } else {
        console.log("🛡️ Skipping countdown start - Phase 2 transition is active");
      }
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
    // Check timer phase and payment status
    const isPhase1Active = window.countdownData && window.countdownData.phase === 1 && window.countdownData.seconds_remaining > 0;
    const isPhase2Active = window.countdownData && window.countdownData.phase === 2 && window.countdownData.seconds_remaining > 0;
    const paymentDeadlineMet = window.countdownData && window.countdownData.payment_deadline_met;
    
    if (isPhase1Active) {
      console.log("⏰ Phase 1 (2-hour timer) is active - hiding price editing controls for host");
      // Hide price editing controls during 2-hour timer period
      hostControls.style.display = "none";
    } else if (paymentDeadlineMet && (isPhase2Active || !isPhase1Active)) {
      console.log("⏰ 20% payment made - showing price editing controls for host");
      // Show price editing controls after 20% payment is made
      hostControls.style.display = "flex";
    } else {
      console.log("⏰ Timer expired or no payment - hiding price editing controls for host");
      hostControls.style.display = "none";
    }
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
      // Group member sees "Leave Group" and "Pay Now" (only after 20% payment is made)
      newCancelBtn.textContent = 'Leave Group';
      newCancelBtn.className = 'leave-btn';
      newCancelBtn.addEventListener('click', handleLeaveGroup);
      
      // Check timer phase and payment status
      const isPhase1Active = window.countdownData && window.countdownData.phase === 1 && window.countdownData.seconds_remaining > 0;
      const paymentDeadlineMet = window.countdownData && window.countdownData.payment_deadline_met;
      
      if (isPhase1Active) {
        console.log("⏰ Phase 1 (2-hour timer) is active - hiding Pay Now button for member");
        // Hide Pay Now button during 2-hour timer period
        newPayBtn.style.display = 'none';
      } else if (paymentDeadlineMet) {
        console.log("⏰ 20% payment made - showing Pay Now button for member");
        newPayBtn.textContent = 'Pay Now';
        newPayBtn.className = 'pay-btn';
        newPayBtn.style.display = 'inline-block';
        console.log("🔗 Adding click listener to Pay Now button (MEMBER)");
        newPayBtn.addEventListener('click', function(e) {
          console.log("🎯 Pay Now button clicked via event listener (MEMBER)");
          handlePayNow();
        });
      } else {
        console.log("⏰ No payment made yet - hiding Pay Now button for member");
        newPayBtn.style.display = 'none';
      }
      
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
  
  // Use server-provided countdown data or calculate Phase 2 timer
  if (window.countdownData && window.countdownData.seconds_remaining !== undefined) {
    window.timeRemaining = window.countdownData.seconds_remaining;
    window.countdownPhase = window.countdownData.phase;
    window.twentyPercentAmount = window.countdownData.twenty_percent_amount;
    window.totalPaid = window.countdownData.total_paid;
    window.paymentDeadlineMet = window.countdownData.payment_deadline_met;
    
    console.log(`⏰ Using countdown data - Phase ${window.countdownPhase}, ${window.timeRemaining} seconds remaining`);
    console.log(`💰 Twenty percent amount: ₪${window.twentyPercentAmount}, Total paid: ₪${window.totalPaid}`);
    
    // If we're in Phase 2, recalculate the timer to ensure accuracy
    if (window.countdownPhase === 2) {
      const bookingDate = document.getElementById('bookingDate').textContent;
      const bookingTime = document.getElementById('bookingTime').textContent;
      const [startTime] = bookingTime.split(' - ');
      
      console.log("📅 Phase 2 timer recalculation inputs:", {
        bookingDate,
        bookingTime,
        startTime
      });
      
      // Parse booking date and time properly with validation
      let bookingDateTime;
      
      try {
        // Try different date formats
        if (bookingDate.includes('/')) {
          // Format: DD/MM/YYYY
          const [day, month, year] = bookingDate.split('/');
          const [hours, minutes] = startTime.split(':');
          
          console.log("📅 Phase 2 recalculation - parsing date components:", { day, month, year, hours, minutes });
          
          // Create booking datetime (note: month is 0-indexed in JavaScript Date)
          bookingDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        } else if (bookingDate.includes('-')) {
          // Format: YYYY-MM-DD
          const [year, month, day] = bookingDate.split('-');
          const [hours, minutes] = startTime.split(':');
          
          console.log("📅 Phase 2 recalculation - parsing date components:", { year, month, day, hours, minutes });
          
          bookingDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        } else {
          // Try direct parsing
          bookingDateTime = new Date(`${bookingDate} ${startTime}`);
        }
        
        // Validate the date
        if (isNaN(bookingDateTime.getTime())) {
          throw new Error('Invalid date created');
        }
        
        console.log("✅ Phase 2 recalculation - valid booking datetime created:", bookingDateTime.toISOString());
        
      } catch (error) {
        console.error("❌ Phase 2 recalculation - date parsing error:", error);
        console.log("📅 Phase 2 recalculation - raw date values:", { bookingDate, startTime });
        
        // Fallback: use current time + 24 hours
        bookingDateTime = new Date();
        bookingDateTime.setHours(bookingDateTime.getHours() + 24);
        console.log("⚠️ Phase 2 recalculation - using fallback date:", bookingDateTime.toISOString());
      }
      
      // Calculate 24 hours before booking
      const twentyFourHoursBeforeBooking = new Date(bookingDateTime);
      twentyFourHoursBeforeBooking.setHours(twentyFourHoursBeforeBooking.getHours() - 24);
      
      // Calculate seconds remaining from now to 24 hours before booking
      const now = new Date();
      const secondsRemaining = Math.max(0, Math.floor((twentyFourHoursBeforeBooking - now) / 1000));
      
      window.timeRemaining = secondsRemaining;
      window.countdownData.seconds_remaining = secondsRemaining;
      
      console.log(`⏰ Phase 2 timer recalculated: ${secondsRemaining} seconds remaining (${Math.floor(secondsRemaining / 3600)} hours)`);
      console.log("⏰ Recalculation details:", {
        now: now.toISOString(),
        bookingDateTime: bookingDateTime.toISOString(),
        twentyFourHoursBeforeBooking: twentyFourHoursBeforeBooking.toISOString(),
        hoursRemaining: Math.floor(secondsRemaining / 3600),
        minutesRemaining: Math.floor((secondsRemaining % 3600) / 60)
      });
    }
  } else {
    console.log('❌ No countdown data from server - using fallback');
    window.timeRemaining = 7200; // 2 hours fallback
    window.countdownPhase = 1;
    window.twentyPercentAmount = Math.round((window.totalVenuePrice * 0.20) * 100) / 100;
    window.totalPaid = totalPaidByAll;
    window.paymentDeadlineMet = totalPaidByAll >= window.twentyPercentAmount;
  }
  
  console.log(`⏰ Starting countdown - Phase ${window.countdownPhase}, ${window.timeRemaining} seconds remaining`);
  
  // Update display immediately
  updateCountdownDisplay();
  
  // Start the countdown interval
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval); // Clear any existing interval
  }
  
  console.log(`⏰ Starting countdown interval for Phase ${window.countdownPhase} with ${window.timeRemaining} seconds`);
  
  window.countdownInterval = setInterval(() => {
    if (window.timeRemaining > 0) {
      window.timeRemaining--;
      updateCountdownDisplay();
    } else {
      // Countdown expired - handle deadline
      console.log(`⏰ Countdown expired for Phase ${window.countdownPhase}`);
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
    // Phase 1: Need to pay 20% within 2 hours of booking creation
    timerTitle.textContent = '⏰ Payment Deadline';
    if (minimumAmount) {
      minimumAmount.textContent = window.twentyPercentAmount;
    }
    
    // Check if current user is a member (not host)
    const isMember = window.currentUserRole === 'member';
    const memberMessage = isMember ? 
      '<br><br><div class="member-notice">ℹ️ <strong>Note:</strong> Only the host can make payments during the 2-hour deadline period. You can pay after the deadline expires.</div>' : '';
    
    timerMessage.innerHTML = `
      You must pay at least <strong>20% (₪<span id="minimumAmount">${window.twentyPercentAmount}</span>)</strong> of the total booking price within 2 hours of booking creation, otherwise the booking will be automatically canceled.
      <br><br>
      <div class="payment-status">
        <span class="current-paid">Currently paid: <strong>₪${window.totalPaid}</strong></span>
      </div>
      ${memberMessage}
    `;
  } else if (window.countdownPhase === 2) {
    // Phase 2: 20% payment made - countdown to 24 hours before booking
    timerTitle.textContent = '⏰ Final Payment Deadline';
    
    // Calculate time until booking
    const bookingDate = document.getElementById('bookingDate').textContent;
    const bookingTime = document.getElementById('bookingTime').textContent;
    const [startTime] = bookingTime.split(' - ');
    const bookingDateTime = new Date(`${bookingDate} ${startTime}`);
    const timeUntilBooking = Math.floor((bookingDateTime - new Date()) / (1000 * 60 * 60)); // hours
    
    timerMessage.innerHTML = `
      <div class="phase2-message">
        <div class="success-badge">✅ 20% Deposit Paid!</div>
        <p>Great! The initial deposit has been paid. Now you have until <strong>24 hours before the booking</strong> to complete the remaining payments.</p>
        <div class="booking-info">
          <span class="booking-countdown">Booking in: <strong>${timeUntilBooking} hours</strong></span>
          <span class="remaining-amount">Remaining: <strong>₪${(window.totalVenuePrice - window.totalPaid).toFixed(2)}</strong></span>
        </div>
        <div class="phase2-note">
          <strong>Note:</strong> All players can now make their payments. The host can edit individual payment amounts.
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
  
  // Update countdown data to reflect expiration
  if (window.countdownData) {
    window.countdownData.seconds_remaining = 0;
  }
  
  // Show expiration message
  const timerMessage = document.querySelector('.timer-message');
  if (timerMessage) {
    if (window.countdownPhase === 1) {
      timerMessage.innerHTML = `
        <div class="countdown-expired">
          <div class="countdown-expired-title">⚠️ Payment Deadline Expired</div>
          <div class="countdown-expired-message">The 2-hour payment deadline has passed. The booking will be cancelled automatically due to insufficient payment.</div>
          <div class="countdown-expired-info">Required: ₪${window.twentyPercentAmount} | Paid: ₪${window.totalPaid}</div>
        </div>
      `;
    } else if (window.countdownPhase === 2) {
      timerMessage.innerHTML = `
        <div class="countdown-expired">
          <div class="countdown-expired-title">⚠️ Final Payment Deadline Expired</div>
          <div class="countdown-expired-message">The final payment deadline (24 hours before booking) has passed. The booking may be cancelled due to incomplete payment.</div>
          <div class="countdown-expired-info">Total Required: ₪${window.totalVenuePrice} | Paid: ₪${window.totalPaid}</div>
        </div>
      `;
    }
  }
  
  // Re-initialize action buttons to show Pay Now button for members after timer expires
  console.log("🔄 Re-initializing action buttons after timer expiration");
  initializeActionButtons();
  
  // Re-initialize player list to show host controls after timer expires
  console.log("🔄 Re-initializing player list after timer expiration");
  populatePlayerList(window.players);
  
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
  
  // Get host information and timer status
  const hostUsername = getHostUsername(window.players);
  const isHost = window.currentUsername === hostUsername;
  const isTimerActive = window.countdownData && window.countdownData.seconds_remaining > 0;
  
  if (totalPriceElement) totalPriceElement.textContent = totalPrice;
  if (initialDepositElement) initialDepositElement.textContent = twentyPercentAmount;
  
  // During timer period, hide regular payment info for host
  if (isHost && isTimerActive) {
    // Hide regular payment fields for host during timer
    if (requiredPaymentElement) {
      requiredPaymentElement.closest('.payment-item').style.display = 'none';
    }
    if (amountPaidElement) {
      amountPaidElement.closest('.payment-item').style.display = 'none';
    }
    // Show only the amount to pay (which will be the 20% deposit)
    if (amountToPayElement) {
      amountToPayElement.textContent = twentyPercentAmount;
    }
  } else {
    // Show all payment fields normally
    if (requiredPaymentElement) {
      requiredPaymentElement.closest('.payment-item').style.display = 'block';
      requiredPaymentElement.textContent = requiredPayment;
    }
    if (amountPaidElement) {
      amountPaidElement.closest('.payment-item').style.display = 'block';
      amountPaidElement.textContent = amountPaid;
    }
    if (amountToPayElement) {
      amountToPayElement.textContent = amountToPay;
    }
  }
  
  // Show/hide initial deposit section
  const initialPaymentSection = document.getElementById('initialPaymentSection');
  if (initialPaymentSection) {
    // Get host information
    const hostUsername = getHostUsername(window.players);
    const isHost = window.currentUsername === hostUsername;
    const isTimerActive = window.countdownData && window.countdownData.seconds_remaining > 0;
    
    if (needsInitialDeposit) {
      initialPaymentSection.style.display = 'block';
      
      // Auto-check the deposit checkbox for host and update label
      const payInitialCheckbox = document.getElementById('payInitialDeposit');
      const checkboxLabel = document.querySelector('label[for="payInitialDeposit"]');
      
      if (payInitialCheckbox) {
        if (isHost) {
          payInitialCheckbox.checked = true;
          // Trigger the change event to update payment amount
          payInitialCheckbox.dispatchEvent(new Event('change'));
          
          // During timer, disable checkbox and show simplified message
          if (isTimerActive) {
            payInitialCheckbox.disabled = true;
            payInitialCheckbox.style.display = 'none'; // Hide the checkbox completely
            
            // Update the message for timer period
            const messageElement = initialPaymentSection.querySelector('p');
            if (messageElement) {
              messageElement.innerHTML = `
                <strong>🏦 20% Deposit Required</strong><br>
                During the 2-hour deadline period, you must pay the 20% deposit to secure this booking.<br>
                <em>Amount: ₪<span id="modalInitialDeposit">${twentyPercentAmount}</span></em>
              `;
            }
            
            // Hide the checkbox label since checkbox is hidden
            if (checkboxLabel) {
              checkboxLabel.style.display = 'none';
            }
          } else {
            // Normal behavior when timer is not active
            payInitialCheckbox.disabled = false;
            payInitialCheckbox.style.display = 'inline-block';
            
            // Update the message for normal period
            const messageElement = initialPaymentSection.querySelector('p');
            if (messageElement) {
              messageElement.textContent = 'As the host, you are responsible for paying the initial 20% deposit to secure the booking.';
            }
            
            // Update label for host
            if (checkboxLabel) {
              checkboxLabel.style.display = 'inline-block';
              checkboxLabel.innerHTML = `Pay the initial 20% deposit (₪<span id="modalInitialDeposit">${twentyPercentAmount}</span>) <strong>- Your Responsibility as Host</strong>`;
            }
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
  
  // Get host information and timer status
  const hostUsername = getHostUsername(window.players);
  const isHost = window.currentUsername === hostUsername;
  const isTimerActive = window.countdownData && window.countdownData.seconds_remaining > 0;
  
  if (payInitialCheckbox.checked) {
    const totalPrice = window.totalVenuePrice || 0;
    const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100; // Keep 2 decimal places like backend
    const totalPaidByAll = window.players.reduce((sum, player) => sum + (player.payment_amount || 0), 0);
    const remainingInitialDeposit = Math.max(0, twentyPercentAmount - totalPaidByAll);
    
    // During 2-hour timer, host can only pay the 20% deposit
    if (isHost && isTimerActive) {
      amountToPayElement.textContent = remainingInitialDeposit;
    } else {
      amountToPayElement.textContent = baseAmountToPay + remainingInitialDeposit;
    }
  } else {
    // During 2-hour timer, host cannot pay their regular amount
    if (isHost && isTimerActive) {
      amountToPayElement.textContent = 0;
    } else {
      amountToPayElement.textContent = baseAmountToPay;
    }
  }
  
  // During timer period, ensure the checkbox is always checked for host
  if (isHost && isTimerActive) {
    payInitialCheckbox.checked = true;
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
      console.log("🎉 Payment successful! Response data:", data);
      showNotification(data.message, 'success');
      closePaymentModal();
      
      // Update local payment data immediately
      console.log("🔄 Updating payment data...");
      updatePaymentDataAfterSuccess(data);
      
      // Check if this payment completes the 20% deposit
      console.log("🔄 Checking for Phase 2 transition...");
      const transitionedToPhase2 = checkAndTransitionToPhase2();
      
      // Only refresh booking details if we didn't transition to Phase 2
      // This prevents the refresh from overriding the Phase 2 state
      if (!transitionedToPhase2) {
        setTimeout(() => {
          console.log("🔄 Refreshing booking details...");
          fetchBookingDetails();
        }, 1000);
      } else {
        console.log("✅ Phase 2 transition completed - skipping refresh to preserve state");
      }
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

function updatePaymentDataAfterSuccess(paymentData) {
  console.log("💰 Updating payment data after success:", paymentData);
  
  // Update the current user's payment amount in the local data
  const currentUser = window.players.find(p => p.username === window.currentUsername);
  if (currentUser) {
    currentUser.payment_amount = paymentData.total_paid;
    console.log("✅ Updated current user payment amount to:", paymentData.total_paid);
  }
  
  // Update global payment tracking
  if (window.countdownData) {
    window.countdownData.total_paid = paymentData.total_paid;
    console.log("✅ Updated global total paid to:", paymentData.total_paid);
  }
  
  // Also update the global totalPaid variable
  window.totalPaid = paymentData.total_paid;
  console.log("✅ Updated window.totalPaid to:", paymentData.total_paid);
}

function checkAndTransitionToPhase2() {
  console.log("🔍 Checking if we should transition to Phase 2...");
  
  const totalPrice = window.totalVenuePrice || 0;
  const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100;
  const totalPaid = window.totalPaid || window.countdownData?.total_paid || 0;
  
  console.log("💰 Payment status check:", {
    totalPrice,
    twentyPercentAmount,
    totalPaid,
    paymentDeadlineMet: totalPaid >= twentyPercentAmount,
    windowTotalPaid: window.totalPaid,
    countdownDataTotalPaid: window.countdownData?.total_paid
  });
  
  // Check if 20% deposit is now paid
  if (totalPaid >= twentyPercentAmount) {
    console.log("🎉 20% deposit completed! Transitioning to Phase 2...");
    
    // Update countdown data to Phase 2
    if (window.countdownData) {
      window.countdownData.phase = 2;
      window.countdownData.payment_deadline_met = true;
      
      // Calculate new timer: current time to 24 hours before booking
      const bookingDate = document.getElementById('bookingDate').textContent;
      const bookingTime = document.getElementById('bookingTime').textContent;
      const [startTime] = bookingTime.split(' - ');
      
      console.log("📅 Timer calculation inputs:", {
        bookingDate,
        bookingTime,
        startTime
      });
      
      // Parse booking date and time properly with validation
      let bookingDateTime;
      
      try {
        // Try different date formats
        if (bookingDate.includes('/')) {
          // Format: DD/MM/YYYY
          const [day, month, year] = bookingDate.split('/');
          const [hours, minutes] = startTime.split(':');
          
          console.log("📅 Parsing date components:", { day, month, year, hours, minutes });
          
          // Create booking datetime (note: month is 0-indexed in JavaScript Date)
          bookingDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        } else if (bookingDate.includes('-')) {
          // Format: YYYY-MM-DD
          const [year, month, day] = bookingDate.split('-');
          const [hours, minutes] = startTime.split(':');
          
          console.log("📅 Parsing date components:", { year, month, day, hours, minutes });
          
          bookingDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
        } else {
          // Try direct parsing
          bookingDateTime = new Date(`${bookingDate} ${startTime}`);
        }
        
        // Validate the date
        if (isNaN(bookingDateTime.getTime())) {
          throw new Error('Invalid date created');
        }
        
        console.log("✅ Valid booking datetime created:", bookingDateTime.toISOString());
        
      } catch (error) {
        console.error("❌ Date parsing error:", error);
        console.log("📅 Raw date values:", { bookingDate, startTime });
        
        // Fallback: try to parse as ISO string or use current time + 24 hours
        bookingDateTime = new Date();
        bookingDateTime.setHours(bookingDateTime.getHours() + 24);
        console.log("⚠️ Using fallback date:", bookingDateTime.toISOString());
      }
      
      // Calculate 24 hours before booking
      const twentyFourHoursBeforeBooking = new Date(bookingDateTime);
      twentyFourHoursBeforeBooking.setHours(twentyFourHoursBeforeBooking.getHours() - 24);
      
      // Calculate seconds remaining from now to 24 hours before booking
      const now = new Date();
      const secondsRemaining = Math.max(0, Math.floor((twentyFourHoursBeforeBooking - now) / 1000));
      
      console.log("⏰ Timer calculation details:", {
        now: now.toISOString(),
        bookingDateTime: bookingDateTime.toISOString(),
        twentyFourHoursBeforeBooking: twentyFourHoursBeforeBooking.toISOString(),
        secondsRemaining,
        hoursRemaining: Math.floor(secondsRemaining / 3600),
        minutesRemaining: Math.floor((secondsRemaining % 3600) / 60)
      });
      
      window.countdownData.seconds_remaining = secondsRemaining;
      window.countdownData.end_time = twentyFourHoursBeforeBooking.toISOString();
      
      console.log("⏰ Phase 2 timer set:", {
        bookingDateTime: bookingDateTime.toISOString(),
        twentyFourHoursBeforeBooking: twentyFourHoursBeforeBooking.toISOString(),
        secondsRemaining,
        hoursRemaining: Math.floor(secondsRemaining / 3600)
      });
    }
    
    // Update global variables
    window.countdownPhase = 2;
    window.paymentDeadlineMet = true;
    window.phase2Transitioned = true; // Set flag to prevent refresh override
    
    // Update UI elements immediately
    updateUIForPhase2();
    
    // Restart countdown with new Phase 2 timer
    startCountdown();
    
    console.log("✅ Successfully transitioned to Phase 2!");
    return true; // Return true to indicate transition occurred
  } else {
    console.log("⏳ 20% deposit not yet completed. Remaining:", twentyPercentAmount - totalPaid);
    return false; // Return false to indicate no transition
  }
}

function updateUIForPhase2() {
  console.log("🎨 Updating UI for Phase 2...");
  
  // Force update the countdown display immediately
  console.log("⏰ Force updating countdown display for Phase 2");
  updateCountdownDisplay();
  
  // Ensure countdown timer is visible
  const countdownTimer = document.getElementById('countdown');
  if (countdownTimer) {
    countdownTimer.style.display = 'flex';
    console.log("✅ Countdown timer made visible");
  } else {
    console.log("❌ Countdown timer element not found");
  }
  
  // Re-initialize action buttons to show Pay Now for members
  console.log("🔘 Re-initializing action buttons");
  initializeActionButtons();
  
  // Re-initialize player list to show host controls
  console.log("👥 Re-initializing player list");
  populatePlayerList(window.players);
  
  console.log("✅ UI updated for Phase 2");
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

// 🔧 DEBUG: Force Phase 2 transition for testing
function forcePhase2Transition() {
  console.log("🔧 DEBUG: Forcing Phase 2 transition...");
  
  // Reset the flag first
  window.phase2Transitioned = false;
  
  // Set payment data to simulate 20% deposit paid
  const totalPrice = window.totalVenuePrice || 100;
  const twentyPercentAmount = Math.round((totalPrice * 0.20) * 100) / 100;
  
  window.totalPaid = twentyPercentAmount;
  if (window.countdownData) {
    window.countdownData.total_paid = twentyPercentAmount;
  }
  
  console.log("💰 Simulated payment data:", {
    totalPrice,
    twentyPercentAmount,
    totalPaid: window.totalPaid
  });
  
  // Force transition to Phase 2
  checkAndTransitionToPhase2();
  
  // Also test the countdown display directly
  console.log("🔧 DEBUG: Testing countdown display...");
  updateCountdownDisplay();
}

// 🔧 DEBUG: Check current timer state
function checkTimerState() {
  console.log("🔧 DEBUG: Current timer state:", {
    countdownPhase: window.countdownPhase,
    timeRemaining: window.timeRemaining,
    totalPaid: window.totalPaid,
    totalVenuePrice: window.totalVenuePrice,
    countdownData: window.countdownData,
    countdownInterval: window.countdownInterval ? 'Running' : 'Stopped'
  });
  
  const countdownTimer = document.getElementById('countdown');
  console.log("🔧 DEBUG: Countdown timer element:", {
    exists: !!countdownTimer,
    display: countdownTimer ? countdownTimer.style.display : 'N/A',
    visible: countdownTimer ? countdownTimer.offsetParent !== null : false
  });
}

// 🔧 DEBUG: Test timer calculation with specific dates
function testTimerCalculation() {
  console.log("🔧 DEBUG: Testing timer calculation...");
  
  // Your specific dates
  const currentTime = new Date('2025-09-10T15:55:00'); // 10/09/2025 15:55
  const bookingDateTime = new Date('2025-09-13T12:00:00'); // 13/09/2025 12:00
  
  // Calculate 24 hours before booking
  const twentyFourHoursBeforeBooking = new Date(bookingDateTime);
  twentyFourHoursBeforeBooking.setHours(twentyFourHoursBeforeBooking.getHours() - 24);
  
  // Calculate seconds remaining
  const secondsRemaining = Math.max(0, Math.floor((twentyFourHoursBeforeBooking - currentTime) / 1000));
  const hoursRemaining = Math.floor(secondsRemaining / 3600);
  const minutesRemaining = Math.floor((secondsRemaining % 3600) / 60);
  
  console.log("🔧 DEBUG: Timer calculation test:", {
    currentTime: currentTime.toISOString(),
    bookingDateTime: bookingDateTime.toISOString(),
    twentyFourHoursBeforeBooking: twentyFourHoursBeforeBooking.toISOString(),
    secondsRemaining,
    hoursRemaining,
    minutesRemaining,
    expectedHours: "Should be around 44 hours"
  });
  
  return {
    hoursRemaining,
    minutesRemaining,
    secondsRemaining
  };
}

// 🔧 DEBUG: Check actual date format from page
function checkDateFormat() {
  console.log("🔧 DEBUG: Checking actual date format from page...");
  
  const bookingDate = document.getElementById('bookingDate').textContent;
  const bookingTime = document.getElementById('bookingTime').textContent;
  
  console.log("🔧 DEBUG: Raw date values from page:", {
    bookingDate,
    bookingTime,
    bookingDateType: typeof bookingDate,
    bookingTimeType: typeof bookingTime,
    bookingDateLength: bookingDate.length,
    bookingTimeLength: bookingTime.length
  });
  
  // Try to parse the time part
  const [startTime] = bookingTime.split(' - ');
  console.log("🔧 DEBUG: Extracted start time:", {
    startTime,
    startTimeType: typeof startTime
  });
  
  return {
    bookingDate,
    bookingTime,
    startTime
  };
}
