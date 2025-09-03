// ✅ DOM elements used throughout the multi-step registration form
var registerForm = document.getElementById("registerForm"); // Get the registration form element
var codeSection = document.getElementById("codeVerification"); // Get the code verification section
var profileForm = document.getElementById("profileForm"); // Get the profile creation form
var message = document.getElementById("verificationMessage"); // Get the message element for status updates
var makeProfileBtn = document.querySelector(".make-profile-btn"); // Select the "Make Profile" button
var rightSection = document.getElementById("rightSection"); // Section for displaying the profile form
var favoriteSportsContainer = document.querySelector(".favorite-sports"); // Container where sports will be injected
var registerContainer = document.getElementsByClassName("register-container")[0]; // Get the registration container
var profileFormContainer = document.getElementById("profileFormContainer"); // Get the container for profile form

// ✅ Load sports dynamically from the server (only if the container exists)
if (favoriteSportsContainer) { // Check if sports container exists
  fetch("verify.php?get_sports=1") // Send GET request to fetch sports
    .then(response => response.text()) // Convert response to text (HTML expected)
    .then(data => {
      favoriteSportsContainer.innerHTML = data; // Insert the returned HTML into the container
    })
    .catch(error => { // Handle errors
      console.error("Error fetching sports:", error); // Log error in console
      favoriteSportsContainer.innerHTML = "<p>Error loading sports options</p>"; // Display fallback message
    });
}

// ✅ Hide the profile section initially
if (rightSection) {
  rightSection.classList.remove("active"); // Remove "active" class to hide the section initially
}

// ✅ Switch to profile creation form when user clicks "Make Profile"
if (makeProfileBtn) { // Check if the button exists
  makeProfileBtn.onclick = function(e) { // Add click event
    e.preventDefault(); // Prevent default form submission
    if (profileFormContainer) profileFormContainer.style.display = "flex"; // Show profile form
    if (registerContainer) registerContainer.style.display = "none"; // Hide registration form
  };
}

// ✅ Go back to the previous step or login page depending on where the user is
window.goBack = function(e) {
  if (e) e.preventDefault();
  
  // Determine which stage we're at and go back accordingly
  if (profileFormContainer && profileFormContainer.style.display === "flex") {
    profileFormContainer.style.display = "none"; // Hide profile form
    registerContainer.style.display = "flex"; // Show registration form
  } else if (codeSection && codeSection.style.display === "block") {
    codeSection.style.display = "none"; // Hide code verification
    registerForm.style.display = "block"; // Show registration form
  } else {
    window.location.href = '../Login_Page/Login.php'; // Redirect to login page
  }
};

// ✅ Attach "go back" logic to all back buttons
document.addEventListener("DOMContentLoaded", function() { // Run after page loads
  var backButtons = document.querySelectorAll('.back-btn'); // Get all back buttons
  backButtons.forEach(function(btn) { // Loop through buttons
    if (!btn.id || btn.id !== "backBtn") { // Exclude the main back button if needed
      btn.onclick = window.goBack; // Assign goBack function
    }
  });
});

// ✅ Handle registration form submission (step 1)
if (registerForm) { // Check if form exists
  registerForm.onsubmit = function(e) {
    e.preventDefault(); // Prevent page reload

    var email = document.getElementById("email").value.trim(); // Get and trim email input
    var password = document.getElementById("password").value; // Get password
    var confirmPassword = document.getElementById("confirmPassword").value; // Get confirmation password

    if (password !== confirmPassword) { // Check if passwords match
      alert("❌ Passwords do not match."); // Show error
      return false; // Stop form submission
    }

    // Send data to backend for registration
    fetch("register.php", {
      method: "POST", // Use POST method
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Send data as form-encoded
      },
      body: new URLSearchParams({ email, password }), // Convert data to URL-encoded string
    })
      .then((res) => res.json()) // Parse response as JSON
      .then((data) => {
        if (data.status === "error") {
          alert(data.message); // Show error from backend
        } else {
          if (registerForm) registerForm.style.display = "none"; // Hide registration form
          if (codeSection) codeSection.style.display = "block"; // Show code verification form
        }
      })
      .catch((err) => {
        alert("Something went wrong."); // General error
        console.error(err); // Log error to console
      });

    return false; // Prevent default behavior
  };
}

// ✅ Show selected profile image before upload
window.previewImage = function() {
  var input = document.getElementById("profileImage"); // File input element
  var preview = document.getElementById("profileImagePreview"); // Image element to show preview
  var removeBtn = document.getElementById("removeImageBtn"); // Button to remove selected image

  if (input && input.files && input.files[0]) { // Check if file is selected
    var reader = new FileReader(); // Create a new file reader
    reader.onload = function(e) { // When file is loaded
      if (preview) {
        preview.src = e.target.result; // Set preview image source
        preview.style.display = "block"; // Show the preview image
      }
      if (removeBtn) removeBtn.style.display = "inline-block"; // Show the remove button
    }
    reader.readAsDataURL(input.files[0]); // Convert file to base64 string
  }
};

// ✅ Remove profile image preview and reset file input
window.removeImage = function() {
  var input = document.getElementById("profileImage"); // File input
  var preview = document.getElementById("profileImagePreview"); // Image preview
  var removeBtn = document.getElementById("removeImageBtn"); // Remove button

  if (input) input.value = ""; // Clear file input
  if (preview) {
    preview.src = "#"; // Reset image source
    preview.style.display = "none"; // Hide preview
  }
  if (removeBtn) removeBtn.style.display = "none"; // Hide remove button
};

// ✅ Send verification code to backend and show result (step 2)
window.verifyCode = function() {
  var code = document.getElementById("codeInput"); // Input field for the verification code
  var codeValue = code ? code.value : ""; // Get code value

  fetch("verify.php", {
    method: "POST", // POST method
    headers: {
      "Content-Type": "application/x-www-form-urlencoded", // URL encoded
    },
    body: new URLSearchParams({ code: codeValue }), // Attach code
  })
    .then((res) => res.json()) // Convert response to JSON
    .then((data) => {
      if (data.status === "success") {
        if (rightSection) {
          rightSection.classList.add("active"); // Make profile section visible
        }

        if (message) {
          message.textContent = "✅ Code Verified! Now you can create your profile."; // Show success message
          message.className = "verification-message success"; // Style success
        }

        if (makeProfileBtn) {
          makeProfileBtn.classList.add("pulsing"); // Add animation
          setTimeout(function() {
            makeProfileBtn.classList.remove("pulsing"); // Remove animation after delay
          }, 3000);
        }

        if (window.sessionUser && window.sessionUser.email && window.sessionUser.password) {
          var profileEmail = document.getElementById("profileEmail"); // Email field
          var profilePassword = document.getElementById("profilePassword"); // Password field
          if (profileEmail) profileEmail.value = window.sessionUser.email; // Autofill email
          if (profilePassword) profilePassword.value = window.sessionUser.password; // Autofill password
        }
      } else if (message) {
        message.textContent = data.message; // Show backend error message
        message.className = "verification-message error"; // Style error
      }
    })
    .catch((err) => {
      if (message) {
        message.textContent = "❌ Something went wrong."; // General error message
        message.className = "verification-message error"; // Style error
      }
      console.error(err); // Log error
    });
};

// ✅ Real-time username validation
function checkUsernameAvailability(username) {
  if (username.length < 3) {
    return; // Don't check if username is too short
  }
  
  fetch("verify.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ 
      check_username: "1", 
      username: username 
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const usernameError = document.getElementById("usernameError");
      if (usernameError) {
        if (data.status === "error") {
          usernameError.textContent = data.message;
          usernameError.style.display = "block";
          usernameError.className = "error-message error";
        } else {
          usernameError.textContent = "✅ Username is available!";
          usernameError.style.display = "block";
          usernameError.className = "error-message success";
        }
      }
    })
    .catch((err) => {
      console.error("Username check error:", err);
    });
}

// ✅ Add username validation event listener
document.addEventListener("DOMContentLoaded", function() {
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    let timeoutId;
    usernameInput.addEventListener("input", function() {
      const username = this.value.trim();
      const usernameError = document.getElementById("usernameError");
      
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Clear error message immediately
      if (usernameError) {
        usernameError.style.display = "none";
      }
      
      // Check username availability after user stops typing for 500ms
      if (username.length >= 3) {
        timeoutId = setTimeout(() => {
          checkUsernameAvailability(username);
        }, 500);
      }
    });
  }
});

// ✅ Final profile submission after verification (step 3)
if (profileForm) { // If profile form exists
  profileForm.onsubmit = function(e) {
    e.preventDefault(); // Prevent form reload

    var formData = new FormData(profileForm); // Collect all form data
    var code = document.getElementById("codeInput"); // Get verification code input
    var codeValue = code ? code.value : ""; // Get code value

    formData.append("code", codeValue); // Add verification code to form data

    fetch("verify.php", {
      method: "POST", // Send form data via POST
      body: formData,
    })
      .then((res) => res.json()) // Convert response to JSON
      .then((data) => {
        if (data.status === "success") {
          if (message) {
            message.textContent = data.message; // Show success message
            message.className = "verification-message success"; // Style success
          }
          setTimeout(function() {
            window.location.href = data.redirect; // Redirect to final destination
          }, 1500);
        } else if (message) {
          message.textContent = data.message; // Show error message
          message.className = "verification-message error"; // Style error
        }
      })
      .catch((err) => {
        if (message) {
          message.textContent = "❌ Something went wrong."; // General error
          message.className = "verification-message error"; // Style error
        }
        console.error(err); // Log error
      });

    return false; // Prevent default form behavior
  };
}
