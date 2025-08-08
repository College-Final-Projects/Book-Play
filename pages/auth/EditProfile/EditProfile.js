// Preview profile image on load
window.previewImage = function () {
  const input = document.getElementById("profileImage");
  const preview = document.getElementById("profileImagePreview");
  const removeBtn = document.getElementById("removeImageBtn");

  const file = input.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    removeBtn.style.display = "inline-block";
  }
};

window.removeImage = function () {
  const input = document.getElementById("profileImage");
  const preview = document.getElementById("profileImagePreview");
  const removeBtn = document.getElementById("removeImageBtn");

  // Clean interface
  input.value = "";
  preview.src = "#";
  preview.style.display = "none";
  removeBtn.style.display = "none";

  // Send request to delete image from database
  fetch("EditProfile.php?action=remove_image")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        alert("⚠️ Failed to remove image from database.");
      }
    })
    .catch(() => {
      alert("⚠️ Error occurred while removing the image.");
    });
};


// Check that phone contains only numbers (also in oninput)
document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 10);
  });

  // You can add any additional validation here later
});
document.addEventListener("DOMContentLoaded", function () {
  // Load user data
  fetch("EditProfile.php?action=get_user_data")
    .then((res) => res.json())
    .then((data) => {
      if (data.error && data.redirect) {
        // User is not logged in, redirect to login page
        window.location.href = data.redirect;
        return;
      }
      
      if (data.success && data.user) {
        const u = data.user;
        document.getElementById("firstName").value = u.first_name || "";
        document.getElementById("lastName").value = u.last_name || "";
        document.getElementById("username").value = u.username || "";
        document.getElementById("age").value = u.age || "";
        document.getElementById("gender").value = u.Gender || "";
        document.getElementById("phone").value = u.phone_number || "";
        document.getElementById("description").value = u.description || "";

        if (u.user_image) {
          const imgPath = `../../../uploads/users/${u.user_image}`;
          const preview = document.getElementById("profileImagePreview");
          const removeBtn = document.getElementById("removeImageBtn");
          preview.src = imgPath;
          preview.style.display = "block";
          removeBtn.style.display = "inline-block";
        }
      }
    })
    .catch((err) => console.error("❌ Error loading profile:", err));

  // Load sports data
  const favoriteSportsContainer = document.getElementById("favoriteSportsContainer");
  if (favoriteSportsContainer) {
    // First get all available sports
    fetch("EditProfile.php?action=get_sports")
      .then((res) => res.json())
      .then((sportsData) => {
        if (sportsData.success && sportsData.sports) {
          // Then get user's favorite sports
          return fetch("EditProfile.php?action=get_user_sports")
            .then((res) => res.json())
            .then((userSportsData) => {
              if (userSportsData.error && userSportsData.redirect) {
                // User is not logged in, redirect to login page
                window.location.href = userSportsData.redirect;
                return;
              }
              
              const userSports = userSportsData.success ? userSportsData.user_sports : [];
              const userSportIds = userSports.map(sport => sport.sport_id);
              
              // Generate HTML for sports checkboxes with proper styling
              let sportsHTML = '';
              sportsData.sports.forEach(sport => {
                const isChecked = userSportIds.includes(sport.sport_id) ? 'checked' : '';
                sportsHTML += `
                  <div class="sport-option">
                    <input type="checkbox" id="sport_${sport.sport_id}" name="favoriteSport[]" value="${sport.sport_name}" ${isChecked}>
                    <label for="sport_${sport.sport_id}" class="sport-label">${sport.sport_name}</label>
                  </div>
                `;
              });
              
              favoriteSportsContainer.innerHTML = sportsHTML;
            });
        }
      })
      .catch((err) => {
        console.error("❌ Error loading sports:", err);
        favoriteSportsContainer.innerHTML = "<p style='color: #ef4444; text-align: center;'>Error loading sports options</p>";
      });
  }
});
// Show window after saving
function showModal() {
  const modal = document.getElementById("confirmationModal");
  if (modal) modal.style.display = "flex";
}

// Close window when pressing OK
window.closeModal = function () {
  const modal = document.getElementById("confirmationModal");
  if (modal) {
    modal.style.display = "none";
    window.location.href = "EditProfile.php"; // redirect after closing
  }
};
function goBack() {
  fetch("EditProfile.php?action=prev")
    .then((res) => res.json())
    .then((data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        history.back();
      }
    });
}
