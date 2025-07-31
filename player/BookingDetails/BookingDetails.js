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

      window.players = data.players;
      window.currentUsername = data.current_user;

      populateBookingDetails(data.booking);
      populatePlayerList(data.players);
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

  window.currentGroupId = booking.group_id;
// ✅ حساب 20% من السعر الكلي
  const totalPrice = parseFloat(booking.total_price);
  document.getElementById("minimumAmount").textContent = (totalPrice * 0.2).toFixed(2);
  const privacyToggle = document.getElementById("privacyToggle");
  const passwordSection = document.getElementById("passwordSection");
  const roomPassword = document.getElementById("roomPassword");
  const editPasswordBtn = document.getElementById("editPasswordBtn");
  const savePasswordBtn = document.getElementById("savePasswordBtn");
  if (booking.created_at) {
    startCountdownFromCreatedAt(booking.created_at);
  }
  if (booking.privacy === "private") {
    window.isPrivate = true;
    privacyToggle.innerHTML = `<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>`;
    privacyToggle.classList.add("private");
    passwordSection.style.display = "block";
  } else {
    window.isPrivate = false;
    privacyToggle.innerHTML = `<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>`;
    privacyToggle.classList.remove("private");
    passwordSection.style.display = "none";
  }

  roomPassword.value = booking.group_password;
  roomPassword.readOnly = true;
  editPasswordBtn.style.display = "none";
  savePasswordBtn.style.display = "none";
}



function populatePlayerList(players) {
  const container = document.getElementById("playersScroll");
  container.innerHTML = "";

  const currentHost = getHostUsername(players);

  players.forEach(p => {
    const isHost = p.is_host == "1";
    const isCurrentUser = p.username === window.currentUsername;
    const isFriend = p.is_friend == "1";

    const playerCard = document.createElement("div");
    playerCard.className = "player-card";

    if (isHost) playerCard.classList.add("host-player");
    else if (isCurrentUser) playerCard.classList.add("me-player");

    let badgeHTML = "";
    if (isHost && isCurrentUser) badgeHTML = `<div class="host-badge">HOST (YOU)</div>`;
    else if (isHost) badgeHTML = `<div class="host-badge">HOST</div>`;
    else if (isCurrentUser) badgeHTML = `<div class="me-badge">ME</div>`;

    // Add buttons for host/friend actions
    let buttonsHTML = "";
    if (!isCurrentUser && window.currentUsername === currentHost) {
      buttonsHTML += `<button class="switch-host-btn">👑 Make Host</button>`;
    }
    if (!isCurrentUser) {
      buttonsHTML += `<button class="friend-btn ${isFriend ? 'friends' : ''}">
        ${isFriend ? '❌ Remove Friend' : '👥 Add Friend'}
      </button>`;
    }

    // Append the full card HTML
   playerCard.innerHTML = `
  ${badgeHTML}
  <img class="player-image" src="${p.user_image}" alt="${p.username}" data-player="${p.username}">
  <div class="player-name">${p.username}</div>
  <div class="payment-amount" data-player="${p.username}">
    <span class="amount-value">${p.paid.toFixed(2)}</span> ₪ Paid<br>
    <small class="info-label">Out of ${p.price.toFixed(2)} ₪</small>
  </div>
  <input class="payment-input" data-player="${p.username}" style="display: none;" value="${p.price}" />
  <div class="player-actions">${buttonsHTML}</div>
`;


    container.appendChild(playerCard);
  });

  const hostControls = document.getElementById("hostControls");
  hostControls.style.display = (currentHost === window.currentUsername) ? "flex" : "none";

  initializePlayerActions();
}



function getHostUsername(players) {
  const host = players.find(p => p.is_host == "1");
  return host ? host.username : null;
}

document.addEventListener("DOMContentLoaded", function () {
  window.isPrivate = false;
  window.isEditingPrices = false;
  window.timeRemaining = 6330;
  window.originalPrices = {};
  window.currentHost = "1";

  initializeScrolling();
  initializeEditPrices();
  initializePlayerActions();
});

function initializePrivacyToggle() {
  const privacyToggle = document.getElementById('privacyToggle');
  const passwordSection = document.getElementById('passwordSection');
  const roomPassword = document.getElementById('roomPassword');
  const copyPasswordBtn = document.getElementById('copyPassword');
  const editPasswordBtn = document.getElementById('editPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');

  const isHost = !!window.players?.find(p => p.username === window.currentUsername && p.is_host == "1");

  if (!isHost) {
    privacyToggle.disabled = true;
    privacyToggle.style.cursor = "not-allowed";
    privacyToggle.style.opacity = "0.6";
    return;
  }

  // زر تعديل الخصوصية
  privacyToggle?.addEventListener('click', function () {
    window.isPrivate = !window.isPrivate;
    const newPrivacy = window.isPrivate ? 'private' : 'public';

    if (window.isPrivate) {
      this.innerHTML = '<span class="privacy-status">Private</span><span class="privacy-icon">🔒</span>';
      this.classList.add('private');
      passwordSection.style.display = 'block';
    } else {
      this.innerHTML = '<span class="privacy-status">Public</span><span class="privacy-icon">🌐</span>';
      this.classList.remove('private');
      passwordSection.style.display = 'none';
    }

    // تحديث الخصوصية في قاعدة البيانات
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
          if (!data.success) {
            showNotification(data.error || 'Failed to update privacy', 'error');
          }
        })
        .catch(() => {
          showNotification('Failed to update privacy', 'error');
        });
    }
  });

  if (isHost) {
    // إظهار زر التعديل
    editPasswordBtn.style.display = "inline-block";

    // زر تعديل كلمة المرور
    editPasswordBtn.addEventListener("click", () => {
      roomPassword.readOnly = false;
      roomPassword.focus();
      editPasswordBtn.style.display = "none";
      savePasswordBtn.style.display = "inline-block";
    });

    // زر حفظ كلمة المرور
    savePasswordBtn.addEventListener("click", () => {
      const newPassword = roomPassword.value.trim();
      if (!newPassword) {
        showNotification("Password cannot be empty!", "error");
        return;
      }

      const formData = new URLSearchParams();
      formData.append("group_id", window.currentGroupId);
      formData.append("new_password", newPassword);

      fetch("updateGroupPassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showNotification("Password updated successfully!", "success");
            roomPassword.readOnly = true;
            savePasswordBtn.style.display = "none";
            editPasswordBtn.style.display = "inline-block";
          } else {
            showNotification(data.error || "Failed to update password", "error");
          }
        })
        .catch(() => {
          showNotification("Error updating password", "error");
        });
    });
  }

  // زر النسخ لجميع المستخدمين
  copyPasswordBtn?.addEventListener('click', function () {
    navigator.clipboard.writeText(roomPassword.value).then(() => {
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
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const isAtStart = scrollContainer.scrollLeft <= 0;
    const isAtEnd = scrollContainer.scrollLeft >= maxScrollLeft - 5;

    leftArrow.disabled = isAtStart;
    rightArrow.disabled = isAtEnd;

    leftArrow.style.opacity = isAtStart ? "0.3" : "1";
    rightArrow.style.opacity = isAtEnd ? "0.3" : "1";
  }

  scrollContainer?.addEventListener('scroll', updateArrowStates);
  setTimeout(updateArrowStates, 100);
}
function initializePlayerActions() {
  document.querySelectorAll('.switch-host-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const playerId = this.closest('.player-card').querySelector('.player-image').dataset.player;
      switchHost(playerId);
    });
  });

  document.querySelectorAll('.friend-btn').forEach((btn) => {
    if (!btn.disabled) {
      btn.addEventListener('click', function () {
        const playerId = this.closest('.player-card').querySelector('.player-image').dataset.player;
        toggleFriend(playerId);
      });
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
function initializeEditPrices() {
  const editBtn = document.getElementById('editPricesBtn');
  const saveBtn = document.getElementById('savePricesBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');

  editBtn?.addEventListener('click', enterEditMode);
  saveBtn?.addEventListener('click', saveChanges);
  cancelBtn?.addEventListener('click', cancelChanges);
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
  const inputs = document.querySelectorAll('.payment-input');
  const updates = [];
  let totalEntered = 0;

  inputs.forEach(input => {
    const username = input.dataset.player;
    const amount = parseFloat(input.value) || 0;
    totalEntered += amount;

    updates.push({ username, amount });
  });

  const totalPrice = parseFloat(document.getElementById("totalPrice").textContent);

  if (totalEntered < totalPrice) {
    showNotification(`Total entered payments (${totalEntered.toFixed(2)} ₪) is less than required total (${totalPrice.toFixed(2)} ₪)`, 'error');
    return;
  }
  if (totalEntered > totalPrice) {
    showNotification(`Total entered payments (${totalEntered.toFixed(2)} ₪) is more than required total (${totalPrice.toFixed(2)} ₪)`, 'error');
    return;
  }

  const payload = {
    group_id: window.currentGroupId,
    updates
  };

  fetch('updatePlayerPrice.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updates.forEach(u => {
          const display = document.querySelector(`.payment-amount[data-player="${u.username}"] .amount-value`);
          if (display) display.textContent = u.amount.toFixed(2);
        });
        exitEditMode();
        showNotification('Prices updated successfully!', 'success');
      } else {
        showNotification(data.error || 'Failed to update prices', 'error');
      }
    })
    .catch(() => showNotification('Server error while saving prices', 'error'));
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
function startCountdownFromCreatedAt(createdAtString) {
  const deadline = new Date(createdAtString).getTime() + (60 * 60 * 1000); // 1 ساعة بعد وقت الإنشاء
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const messageEl = document.querySelector(".timer-message");

  function updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = deadline - now;

    if (timeLeft <= 0) {
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      messageEl.innerHTML = "⛔ Payment time expired. Booking may be canceled.";
      clearInterval(window.paymentTimer);
      return;
    }

    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown(); // تحديث فوري
  window.paymentTimer = setInterval(updateCountdown, 1000); // تحديث كل ثانية
}
document.getElementById("backButton")?.addEventListener("click", () => {
  window.history.back();
});
