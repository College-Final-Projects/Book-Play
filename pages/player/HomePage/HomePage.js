function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('active');
  }
   // Close the menu when clicking outside
  document.addEventListener('click', function (e) {
    const profileContainer = document.querySelector('.profile-container');
    const menu = document.getElementById('profileMenu');
    if (!profileContainer.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

// Load friend counts on page load
function loadFriendCounts() {
    fetch('../MyFriends/friends_api.php?action=get_counts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the My Friends card with counts
                const friendsCard = document.querySelector('.btn-friends');
                if (friendsCard) {
                    const span = friendsCard.querySelector('span');
                    if (span) {
                        span.innerHTML = `My Friends <span class="count-badge">${data.friends_count}</span>`;
                        if (data.requests_count > 0) {
                            span.innerHTML += ` <span class="requests-badge">${data.requests_count}</span>`;
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error loading friend counts:', error);
        });
}

// Helper function to show temporary messages on screen
function showTempMessage(message, duration) {
  const msg = document.createElement("div");
  msg.textContent = message;
  msg.style.position = "fixed";
  msg.style.bottom = "80px";
  msg.style.right = "20px";
  msg.style.background = "#1e90ff";
  msg.style.color = "white";
  msg.style.padding = "12px 20px";
  msg.style.borderRadius = "10px";
  msg.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  msg.style.zIndex = 1000;
  msg.style.fontSize = "14px";
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), duration);
}

// Main DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 HomePage.js DOMContentLoaded triggered");
  
  // Load friend counts
  loadFriendCounts();
  
  // Load user profile image and username
  loadUserProfile();
  
  // Handle admin request functionality
  handleAdminRequest();
});

// Function to load user profile image and username
function loadUserProfile() {
  console.log("👤 Loading user profile...");
  
  fetch("HomePage.php?action=get_user_image")
    .then((res) => {
      console.log("📡 User profile API response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("📊 User profile data:", data);
      
      const imgElement = document.getElementById("userProfileImage");
      const usernameSpan = document.getElementById("usernameDisplay");
      
      if (!imgElement || !usernameSpan) {
        console.error("❌ Profile elements not found in DOM");
        return;
      }
      
      if (data.image) {
        const imagePath = "../../../uploads/users/" + data.image;
        console.log("🖼️ Setting profile image:", imagePath);
        imgElement.src = imagePath;
        
        // Add error handling for image
        imgElement.onerror = function() {
          console.log("❌ Profile image failed to load, using default");
          this.src = "../../../uploads/users/default.jpg";
        };
      } else {
        console.log("🖼️ No profile image, using default");
        imgElement.src = "../../../uploads/users/default.jpg";
      }
      
      if (data.username) {
        console.log("👤 Setting username:", data.username);
        usernameSpan.textContent = data.username;
      }
    })
    .catch((error) => {
      console.error("❌ Error fetching user profile:", error);
      // Fallback to default image
      const imgElement = document.getElementById("userProfileImage");
      if (imgElement) {
        imgElement.src = "../../../uploads/users/default.jpg";
      }
    });
}

// Function to handle admin request functionality
function handleAdminRequest() {
  const adminBtn = document.getElementById("adminRequestBtn");
  if (!adminBtn) {
    console.log("ℹ️ Admin request button not found (user might be admin)");
    return;
  }
  
  console.log("👑 Admin request button found, checking status...");

  // Check admin status and if a request has already been submitted
  fetch("../../../admin_actions.php?action=check")
    .then((res) => {
      console.log("📡 Admin check response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("📊 Admin check response:", data);
      
      // Hide the button if the user is an admin
      if (data.is_admin) {
        console.log("👑 User is admin, hiding button");
        adminBtn.style.display = "none";
        return;
      }

      console.log("👤 User is not admin, showing button");

      // Handle button click
      adminBtn.addEventListener("click", () => {
        console.log("🖱️ Admin request button clicked");
        
        if (data.already_requested) {
          // Show waiting message if request already submitted
          showTempMessage(
            "🕐 Your admin request is under review. Thank you for your patience.",
            4000
          );
        } else {
          // Send admin request
          fetch("../../../admin_actions.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "action=submit",
          })
            .then((res) => {
              console.log("📡 Submit response status:", res.status);
              return res.json();
            })
            .then((response) => {
              console.log("📊 Submit response:", response);
              if (response.success) {
                showTempMessage(
                  "✅ Your admin request has been submitted. We'll review it as soon as possible.",
                  4000
                );
                data.already_requested = true; // Prevent re-submission
              } else {
                showTempMessage(
                  "❌ " + (response.message || "Failed to submit request."),
                  4000
                );
              }
            })
            .catch((error) => {
              console.error("❌ Error submitting request:", error);
              showTempMessage(
                "❌ Could not connect to server. Try again later.",
                4000
              );
            });
        }
      });
    })
    .catch((error) => {
      console.error("❌ Error checking admin status:", error);
      showTempMessage(
        "❌ Could not check admin status. Try again later.",
        4000
      );
    });
}