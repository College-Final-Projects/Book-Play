/**
 * Shared JavaScript Functions
 * 
 * This file contains common JavaScript functions used across the BOOK-PLAY application.
 * It includes utility functions for UI interactions, user profile management,
 * and admin request functionality.
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

/**
 * Toggle profile menu visibility
 * Shows/hides the user profile dropdown menu
 */
function toggleProfileMenu() {
  const menu = document.getElementById('profileMenu');
  menu.classList.toggle('active');
}

/**
 * Close profile menu when clicking outside
 * Automatically closes the profile dropdown when user clicks elsewhere
 */
document.addEventListener('click', function (e) {
  const profileContainer = document.querySelector('.profile-container');
  const menu = document.getElementById('profileMenu');
  if (!profileContainer.contains(e.target)) {
    menu.classList.remove('active');
  }
});

/**
 * Show temporary message notification
 * Creates and displays a temporary toast message on screen
 * 
 * @param {string} message - The message text to display
 * @param {number} duration - Duration in milliseconds to show the message
 */
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

/**
 * Load user profile image and username
 * Fetches and displays the current user's profile image and username
 * from the server and updates the UI elements
 */
function loadUserProfile() {
  fetch("HomePage.php?action=get_user_image")
    .then((res) => res.json())
    .then((data) => {
      const imgElement = document.getElementById("userProfileImage");
      const usernameSpan = document.getElementById("usernameDisplay");
      
      // Update profile image if available
      if (imgElement && data.image) {
        imgElement.src = `../../../uploads/users/${data.image}`;
      }
      
      // Update username display if available
      if (usernameSpan && data.username) {
        usernameSpan.textContent = data.username;
      }
    })
    .catch((err) => {
      console.error("Failed to load user image or username", err);
    });
}

/**
 * Initialize admin request button functionality
 * Sets up the admin request button with proper event handling and status checking
 */
function initAdminRequestButton() {
  const adminBtn = document.getElementById("adminRequestBtn");
  if (!adminBtn) return; // Exit if the button doesn't exist

  // Check admin status and if a request has already been submitted
  fetch("../../admin_actions.php?action=check")
    .then((res) => res.json())
    .then((data) => {
      // Hide the button if the user is already an admin
      if (data.is_admin) {
        adminBtn.style.display = "none";
        return;
      }

      // Handle button click event
      adminBtn.addEventListener("click", () => {
        if (data.already_requested) {
          // Show waiting message if request already submitted
          showTempMessage(
            "🕐 Your admin request is under review. Thank you for your patience.",
            4000
          );
        } else {
          // Send new admin request
          fetch("../../admin_actions.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "action=submit",
          })
            .then((res) => res.json())
            .then((response) => {
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
              console.error("Error submitting request:", error);
              showTempMessage(
                "❌ Could not connect to server. Try again later.",
                4000
              );
            });
        }
      });
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
      showTempMessage(
        "❌ Could not check admin status. Try again later.",
        4000
      );
    });
}

/**
 * Initialize shared functionality when DOM is loaded
 * Sets up common features like user profile loading and admin request button
 */
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();        // Load and display user profile information
  initAdminRequestButton(); // Initialize admin request functionality
}); 