// Toggle the profile menu visibility
function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  menu.classList.toggle("active");
}

// Close the profile menu when clicking outside of it
document.addEventListener("click", function (e) {
  const profileContainer = document.querySelector(".profile-container");
  const menu = document.getElementById("profileMenu");
  if (!profileContainer.contains(e.target)) {
    menu.classList.remove("active");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("adminRequestBtn");
  if (!adminBtn) return; // Exit if the button doesn't exist

  // Check admin status and if a request has already been submitted
  fetch("../../admin_actions.php?action=check")
    .then((res) => res.json())
    .then((data) => {
      // Hide the button if the user is an admin
      if (data.is_admin) {
        adminBtn.style.display = "none";
        return;
      }

      // Handle button click
      adminBtn.addEventListener("click", () => {
        if (data.already_requested) {
          // Show waiting message if request already submitted
          showTempMessage(
            "🕐 Your admin request is under review. Thank you for your patience.",
            4000
          );
        } else {
          // Send admin request
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
});

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
document.addEventListener("DOMContentLoaded", () => {
  fetch("HomePage.php?action=get_user_image")
    .then((res) => res.json())
    .then((data) => {
      const imgElement = document.getElementById("userProfileImage");
      const usernameSpan = document.getElementById("usernameDisplay");
      if (imgElement && data.image) {
        imgElement.src = `../../uploads/users/${data.image}`;
      }
      if (usernameSpan && data.username) {
        usernameSpan.textContent = data.username;
      }
    })
    .catch((err) => {
      console.error("Failed to load user image or username", err);
    });
});
