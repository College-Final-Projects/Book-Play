// Define global back functions at the very top of the file
// This ensures they're available regardless of when the button is clicked
window.goBack = function() {
  var codeVerification = document.getElementById('codeVerification');
  var registerForm = document.getElementById('registerForm');
  
  if (codeVerification) codeVerification.style.display = 'none';
  if (registerForm) registerForm.style.display = 'block';
  
  console.log('Verification back button clicked - returning to registration form');
  return false; // Prevent any default action
};

// Use window.addEventListener('load') which fires after everything is loaded
// This is more reliable than DOMContentLoaded for complex pages
window.addEventListener('load', function() {
  console.log("Window fully loaded, setting up all event handlers");
  
  // Set up the back button on the registration form
  var backBtn = document.getElementById('backBtn');
  if (backBtn) {
    // Use direct onclick property for maximum compatibility
    backBtn.onclick = function() {
      console.log('Registration back button clicked');
      window.location.href = 'login.html'; // Change to your desired destination
      return false; // Prevent form submission
    };
  } else {
    console.log("Warning: Back button element not found");
  }
  
  // For the RTL Hebrew buttons
  var rtlBackButtons = document.querySelectorAll('.rtl-secondary-btn');
  rtlBackButtons.forEach(function(button) {
    button.onclick = function() {
      var container = this.closest('.rtl-buttons-container');
      if (container) container.style.display = 'none';
      
      var registerContainer = document.querySelector('.register-container');
      if (registerContainer) registerContainer.style.display = 'flex';
      
      console.log('RTL back button clicked - returning to previous section');
      return false;
    };
  });
  
  // ====== Original code starts here ======
  var registerForm = document.getElementById("registerForm");
  var codeSection = document.getElementById("codeVerification");
  var profileForm = document.getElementById("profileForm");
  var message = document.getElementById("verificationMessage");
  var makeProfileBtn = document.querySelector(".make-profile-btn");
  var rightSection = document.getElementById("rightSection");
  var favoriteSportsContainer = document.querySelector(".favorite-sports");

  // Fetch sports from the database and populate the options
  if (favoriteSportsContainer) {
    fetch("verify.php?get_sports=1")
      .then(response => response.text())
      .then(data => {
        favoriteSportsContainer.innerHTML = data;
      })
      .catch(error => {
        console.error("Error fetching sports:", error);
        favoriteSportsContainer.innerHTML = "<p>Error loading sports options</p>";
      });
  }

  // Initially keep the right section in disabled state
  if (rightSection) {
    rightSection.classList.remove("active");
  }

  // Add click event listener for the Make Profile button
  if (makeProfileBtn) {
    makeProfileBtn.onclick = function(e) {
      e.preventDefault();
      var profileFormContainer = document.getElementById("profileFormContainer");
      var registerContainer = document.getElementsByClassName("register-container")[0];
      
      if (profileFormContainer) profileFormContainer.style.display = "flex";
      if (registerContainer) registerContainer.style.display = "none";
    };
  }

  if (registerForm) {
    registerForm.onsubmit = function(e) {
      e.preventDefault();

      var email = document.getElementById("email").value.trim();
      var password = document.getElementById("password").value;
      var confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("❌ Passwords do not match.");
        return false;
      }

      fetch("register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email, password }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "error") {
            alert(data.message);
          } else {
            if (registerForm) registerForm.style.display = "none";
            if (codeSection) codeSection.style.display = "block";
          }
        })
        .catch((err) => {
          alert("Something went wrong.");
          console.error(err);
        });
        
      return false;
    };
  }

  // ✅ Image preview function
  window.previewImage = function() {
    var input = document.getElementById("profileImage");
    var preview = document.getElementById("profileImagePreview");
    var removeBtn = document.getElementById("removeImageBtn");
    
    if (input && input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        if (preview) {
          preview.src = e.target.result;
          preview.style.display = "block";
        }
        if (removeBtn) removeBtn.style.display = "inline-block";
      }
      reader.readAsDataURL(input.files[0]);
    }
  };

  // ✅ Remove image function
  window.removeImage = function() {
    var input = document.getElementById("profileImage");
    var preview = document.getElementById("profileImagePreview");
    var removeBtn = document.getElementById("removeImageBtn");
    
    if (input) input.value = "";
    if (preview) {
      preview.src = "#";
      preview.style.display = "none";
    }
    if (removeBtn) removeBtn.style.display = "none";
  };

  // ✅ دالة التحقق من الكود
  window.verifyCode = function() {
    var code = document.getElementById("codeInput");
    var codeValue = code ? code.value : "";

    fetch("verify.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ code: codeValue }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          // Enable the right section and make the profile button
          if (rightSection) {
            rightSection.classList.add("active");
          }
          
          if (message) {
            message.textContent = "✅ Code Verified! Now you can create your profile.";
            message.className = "verification-message success";
          }

          // Add pulsing effect to the Make Profile button
          if (makeProfileBtn) {
            makeProfileBtn.classList.add("pulsing");
            setTimeout(function() {
              makeProfileBtn.classList.remove("pulsing");
            }, 3000);
          }

          if (window.sessionUser && window.sessionUser.email && window.sessionUser.password) {
            var profileEmail = document.getElementById("profileEmail");
            var profilePassword = document.getElementById("profilePassword");
            
            if (profileEmail) profileEmail.value = window.sessionUser.email;
            if (profilePassword) profilePassword.value = window.sessionUser.password;
          }
        } else if (message) {
          message.textContent = data.message;
          message.className = "verification-message error";
        }
      })
      .catch((err) => {
        if (message) {
          message.textContent = "❌ Something went wrong.";
          message.className = "verification-message error";
        }
        console.error(err);
      });
  };

  // ✅ دالة حفظ البروفايل بعد التحقق
  if (profileForm) {
    profileForm.onsubmit = function(e) {
      e.preventDefault();

      var formData = new FormData(profileForm);
      var code = document.getElementById("codeInput");
      var codeValue = code ? code.value : "";
      
      formData.append("code", codeValue);

      fetch("verify.php", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            if (message) {
              message.textContent = data.message;
              message.className = "verification-message success";
            }
            setTimeout(function() {
              window.location.href = data.redirect;
            }, 1500);
          } else if (message) {
            message.textContent = data.message;
            message.className = "verification-message error";
          }
        })
        .catch((err) => {
          if (message) {
            message.textContent = "❌ Something went wrong.";
            message.className = "verification-message error";
          }
          console.error(err);
        });
        
      return false;
    };
  }
});