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

// Admin Request Functionality
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("adminRequestBtn");
  if (!adminBtn) {
    console.error("Admin request button not found!");
    return;
  }
  
  console.log("Admin request button found, checking status...");

  // Check admin status and if a request has already been submitted
  fetch("../../../admin_actions.php?action=check")
    .then((res) => {
      console.log("Response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Admin check response:", data);
      
      // Hide the button if the user is an admin
      if (data.is_admin) {
        console.log("User is admin, hiding button");
        adminBtn.style.display = "none";
        return;
      }

      console.log("User is not admin, showing button");

      // Handle button click
      adminBtn.addEventListener("click", () => {
        console.log("Admin request button clicked");
        
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
              console.log("Submit response status:", res.status);
              return res.json();
            })
            .then((response) => {
              console.log("Submit response:", response);
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
      
      if (data.success) {
        if (data.user_image) {
          imgElement.src = "../../../uploads/users/" + data.user_image;
        }
        usernameSpan.textContent = data.username;
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });
});