let allGroups = [];
let userLocation = null;
let selectedGroup = null;
let currentGroupsData = [];

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

function sortGroups(groups, sortOptions) {
  console.log('🔄 Sorting groups with options:', sortOptions);
  console.log('📊 Before filtering - groups count:', groups.length);
  
  // Debug: Log first few groups to check data
  console.log('🔍 Sample group data:', groups.slice(0, 3).map(g => ({
    name: g.group_name,
    rating: g.rating,
    price: g.price,
    distance: g.distance,
    privacy: g.privacy
  })));
  
  // First filter by privacy if needed
  if (sortOptions.public === "public-only") {
    groups = groups.filter(g => g.privacy === 'public');
    console.log('✅ After public filter - groups count:', groups.length);
  } else if (sortOptions.public === "private-only") {
    groups = groups.filter(g => g.privacy === 'private');
    console.log('✅ After private filter - groups count:', groups.length);
  }
  // Note: "public-all" shows all groups (no filtering needed)

  // Sort groups based on selected options
  groups.sort((a, b) => {
    let comparison = 0;
    
    // Distance sorting (highest priority)
    if (sortOptions.distance === "distance-near") {
      if (a.distance !== undefined && b.distance !== undefined) {
        comparison = a.distance - b.distance;
        if (comparison !== 0) return comparison;
      }
    } else if (sortOptions.distance === "distance-far") {
      if (a.distance !== undefined && b.distance !== undefined) {
        comparison = b.distance - a.distance;
        if (comparison !== 0) return comparison;
      }
    }

    // Rating sorting
    if (sortOptions.rating === "rating-high") {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      comparison = ratingB - ratingA;
      if (comparison !== 0) return comparison;
    } else if (sortOptions.rating === "rating-low") {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      comparison = ratingA - ratingB;
      if (comparison !== 0) return comparison;
    }

    // Price sorting
    if (sortOptions.price === "price-low") {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      comparison = priceA - priceB;
      if (comparison !== 0) return comparison;
    } else if (sortOptions.price === "price-high") {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      comparison = priceB - priceA;
      if (comparison !== 0) return comparison;
    }

    return 0;
  });

  console.log('✅ After sorting - groups count:', groups.length);
  
  // Log final sorted order for debugging
  console.log('📋 Final sorted order (first 5):', groups.slice(0, 5).map(g => ({
    name: g.group_name,
    price: `₪${g.price}`,
    rating: g.rating || 0,
    distance: g.distance ? `${g.distance.toFixed(2)}km` : 'N/A',
    privacy: g.privacy
  })));
  
  return groups;
}

// Function to clear all sorts
function clearAllSorts() {
  // Set all sort options to "none" (except public which defaults to "all")
  document.getElementById('public-all').checked = true;
  document.getElementById('price-none').checked = true;
  document.getElementById('rating-none').checked = true;
  document.getElementById('distance-none').checked = true;
  
  // Re-render groups without any sorting
  if (currentGroupsData.length > 0) {
    renderGroups([...currentGroupsData]);
  }
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
          
          // Store the groups data globally
          currentGroupsData = allGroups;
          
          const sortOptions = {
            public: document.querySelector("input[name='public-sort']:checked")?.id,
            price: document.querySelector("input[name='price-sort']:checked")?.id,
            rating: document.querySelector("input[name='rating-sort']:checked")?.id,
            distance: document.querySelector("input[name='distance-sort']:checked")?.id
          };
          
          console.log('Sort options:', sortOptions);
          
          const sortedGroups = sortGroups([...allGroups], sortOptions);
          renderGroups(sortedGroups);
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
            <span>👥 ${group.current_members || 0}/${group.max_members || 10} players</span>
            <span>⭐ ${group.rating ? parseFloat(group.rating).toFixed(1) : "N/A"} | 📍 ${group.distance ? group.distance.toFixed(2) + " km" : "N/A"}</span>
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

// Event listeners for sorting (BookVenue style)
document.addEventListener("DOMContentLoaded", () => {
  // Debug: Check initial radio button states
  console.log('🔍 Initial radio button states:');
  console.log('Public:', document.querySelector("input[name='public-sort']:checked")?.id);
  console.log('Price:', document.querySelector("input[name='price-sort']:checked")?.id);
  console.log('Rating:', document.querySelector("input[name='rating-sort']:checked")?.id);
  console.log('Distance:', document.querySelector("input[name='distance-sort']:checked")?.id);

  const sortGroupNames = ["public-sort", "price-sort", "rating-sort", "distance-sort"];
  sortGroupNames.forEach(group => {
    document.querySelectorAll(`input[name='${group}']`).forEach(radio => {
      radio.addEventListener("change", () => {
        console.log(`🔄 Radio changed: ${group} - ${radio.id}`);
        
        // Only resort existing data, don't make new API call
        if (currentGroupsData.length > 0) {
          const sortOptions = {
            public: document.querySelector("input[name='public-sort']:checked")?.id,
            price: document.querySelector("input[name='price-sort']:checked")?.id,
            rating: document.querySelector("input[name='rating-sort']:checked")?.id,
            distance: document.querySelector("input[name='distance-sort']:checked")?.id
          };
          
          console.log('🔄 Sorting existing data with options:', sortOptions);
          console.log('📊 Current groups data length:', currentGroupsData.length);
          
          // Show before/after sorting for debugging
          const beforeSorting = [...currentGroupsData].slice(0, 3).map(g => ({
            name: g.group_name,
            price: g.price,
            rating: g.rating,
            privacy: g.privacy
          }));
          console.log('📋 Before sorting (first 3):', beforeSorting);
          
          const sortedGroups = sortGroups([...currentGroupsData], sortOptions);
          
          const afterSorting = sortedGroups.slice(0, 3).map(g => ({
            name: g.group_name,
            price: g.price,
            rating: g.rating,
            privacy: g.privacy
          }));
          console.log('📋 After sorting (first 3):', afterSorting);
          
          renderGroups(sortedGroups);
        } else {
          console.log('⚠️ No groups data available for sorting');
        }
      });
    });
  });

  // Search functionality
  const searchInput = document.getElementById("playerSearch");
  let searchTimeout;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchValue = searchInput.value.trim();
      if (searchValue === '') {
        // If search is empty, show all groups with current sorting
        if (currentGroupsData.length > 0) {
          const sortOptions = {
            public: document.querySelector("input[name='public-sort']:checked")?.id,
            price: document.querySelector("input[name='price-sort']:checked")?.id,
            rating: document.querySelector("input[name='rating-sort']:checked")?.id,
            distance: document.querySelector("input[name='distance-sort']:checked")?.id
          };
          const sortedGroups = sortGroups([...currentGroupsData], sortOptions);
          renderGroups(sortedGroups);
        }
      } else {
        // Filter groups by search term
        const filtered = currentGroupsData.filter(group =>
          group.group_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          group.location.toLowerCase().includes(searchValue.toLowerCase())
        );
        
        const sortOptions = {
          public: document.querySelector("input[name='public-sort']:checked")?.id,
          price: document.querySelector("input[name='price-sort']:checked")?.id,
          rating: document.querySelector("input[name='rating-sort']:checked")?.id,
          distance: document.querySelector("input[name='distance-sort']:checked")?.id
        };
        
        const sortedGroups = sortGroups([...filtered], sortOptions);
        renderGroups(sortedGroups);
      }
    }, 300);
  });
});
