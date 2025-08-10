let allGroups = [];
let userLocation = null;
let selectedGroup = null;

function toggleFavorite(element) {
  element.classList.toggle("active");
}

// ✅ Filter venues by selected sports
function filterVenuesBySports(selectedSports) {
  if (!selectedSports || selectedSports.length === 0) {
    renderGroups(allGroups);
    return;
  }
  
  const filtered = allGroups.filter(group => 
    selectedSports.includes(group.SportCategory)
  );
  renderGroups(filtered);
}

// ✅ View Booking Details (for image clicks)
function viewBookingDetails(booking_id) {
  const url = `../BookingDetails/BookingDetails.php?booking_id=${encodeURIComponent(booking_id)}&view_only=true`;
  window.location.href = url;
}

window.onload = function () {
  getUserLocation().then(location => {
    userLocation = location;

    fetch("JoinGroupAPI.php")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.groups)) {
          allGroups = data.groups.map(group => ({
            ...group,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              parseFloat(group.latitude),
              parseFloat(group.longitude)
            )
          }));
          renderGroups(allGroups);
        } else {
          console.error("Invalid response format:", data);
        }
      })
      .catch(err => console.error("Failed to fetch groups:", err));
  });
};

function renderGroups(groups) {
  const container = document.getElementById("groupsContainer");
  container.innerHTML = "";

  groups.forEach(group => {
    const isPrivate = group.privacy === 'private';
    const current = group.current_members;
    const max = group.max_members;
    const isMember = group.is_member === 1;

    const card = document.createElement("div");
    card.className = "venue-card";
    card.setAttribute("data-group-type", group.privacy);
    if (isPrivate) card.setAttribute("data-access-code", group.group_password);

    const groupDataEncoded = JSON.stringify(group).replace(/'/g, "&apos;");

    card.innerHTML = `
      <div class="venue-card-header">
        <span class="group-badge ${group.privacy}">${group.privacy.toUpperCase()}</span>
      </div>
      <div class="venue-image">
        <img src="${group.image_url.replace(/\\/g, "/")}" alt="Venue Image" onclick="viewBookingDetails(${group.booking_id})" style="cursor: pointer;">
      </div>
      <div class="venue-info">
        <h3 class="venue-title">${group.group_name}</h3>
        <p class="venue-location">📍 ${group.location}</p>
        <div class="venue-tags">
          <span class="tag">${group.SportCategory}</span>
          <span class="player-count">
            ⭐ ${group.rating ? parseFloat(group.rating).toFixed(1) : "N/A"} |
            📍 ${group.distance ? group.distance.toFixed(2) + " km" : "N/A"}
          </span>
        </div>
        <div class="venue-footer">
          <span class="venue-price">₪${group.price}<span class="per">/person</span></span>
          <button class="join-btn ${isMember ? 'disabled' : ''}" data-group='${groupDataEncoded}' onclick="handleJoinClick(this)" ${isMember ? 'disabled' : ''}>
            ${isMember ? 'Already Joined' : 'Join Group'}
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ✅ Handle Join Button Click Safely
function handleJoinClick(button) {
  // Check if button is disabled (user already joined)
  if (button.disabled || button.classList.contains('disabled')) {
    return;
  }

  try {
    const groupData = JSON.parse(button.dataset.group.replace(/&apos;/g, "'"));
    joinGroup(groupData);
  } catch (e) {
    console.error("Failed to parse group data:", e);
  }
}

// ✅ Join Group
function joinGroup(group) {
  selectedGroup = group;

  if (group.privacy === 'private') {
    document.getElementById('accessCodeInput').value = '';
    document.getElementById('privateModal').style.display = 'block';
  } else {
    // For public groups, join directly
    joinGroupAPI(group.group_id, '');
  }
}

// ✅ Validate Private Code
function validateAccessCode() {
  const enteredCode = document.getElementById('accessCodeInput').value.trim();

  if (!enteredCode) {
    alert("Please enter an access code.");
    return;
  }

  // Join the group with the access code
  joinGroupAPI(selectedGroup.group_id, enteredCode);
}

// ✅ New function to handle joining via API
function joinGroupAPI(groupId, accessCode) {
  const formData = new FormData();
  formData.append('group_id', groupId);
  formData.append('access_code', accessCode);

  // Show loading state
  const joinBtn = document.querySelector(`[data-group*='"group_id":"${groupId}"']`);
  if (joinBtn) {
    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
  }

  fetch('join_group_api.php', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      closeModal();
      alert(data.message);
      // Redirect to BookingDetails page
      window.location.href = data.redirect_url;
    } else {
      alert(data.error || 'Failed to join group');
      if (selectedGroup.privacy === 'private') {
        document.getElementById('accessCodeInput').value = '';
        document.getElementById('accessCodeInput').focus();
      }
      // Reset button state on error
      if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.textContent = 'Join Group';
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while joining the group');
    // Reset button state on error
    if (joinBtn) {
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join Group';
    }
  });
}

function closeModal() {
  document.getElementById('privateModal').style.display = 'none';
}

// 🌍 Location helpers
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      reject("No geolocation");
    } else {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          alert("Please allow location access to sort by distance.");
          reject(error);
        }
      );
    }
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ Search
document.getElementById('playerSearch').addEventListener('input', function () {
  const query = this.value.trim().toLowerCase();
  const filtered = allGroups.filter(group =>
    group.group_name.toLowerCase().startsWith(query)
  );
  renderGroups(filtered);
});

// ✅ Sort
document.getElementById('price-low').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => a.price - b.price));
});

document.getElementById('price-high').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => b.price - a.price));
});

document.getElementById('only-public').addEventListener('change', () => {
  renderGroups(allGroups.filter(g => g.privacy === 'public'));
});

document.getElementById('only-private').addEventListener('change', () => {
  renderGroups(allGroups.filter(g => g.privacy === 'private'));
});

document.getElementById('all-groups').addEventListener('change', () => {
  renderGroups(allGroups);
});

document.getElementById('rating-low').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => (a.rating || 0) - (b.rating || 0)));
});

document.getElementById('rating-high').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => (b.rating || 0) - (a.rating || 0)));
});

document.getElementById('distance-near').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => a.distance - b.distance));
});

document.getElementById('distance-far').addEventListener('change', () => {
  renderGroups([...allGroups].sort((a, b) => b.distance - a.distance));
});
