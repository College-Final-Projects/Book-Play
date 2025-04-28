document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const codeSection = document.getElementById("codeVerification");
  const profileForm = document.getElementById("profileForm");
  const message = document.getElementById("verificationMessage");
  const makeProfileBtn = document.querySelector(".make-profile-btn");
  const rightSection = document.getElementById("rightSection");
  const favoriteSportsContainer = document.querySelector(".favorite-sports");

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
    makeProfileBtn.addEventListener("click", function(e) {
      e.preventDefault();
      document.getElementById("profileFormContainer").style.display = "flex";
      document.getElementsByClassName("register-container")[0].style.display = "none";
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("❌ Passwords do not match.");
        return;
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
            registerForm.style.display = "none";
            codeSection.style.display = "block";
          }
        })
        .catch((err) => {
          alert("Something went wrong.");
          console.error(err);
        });
    });
  }

  // ✅ Image preview function
  window.previewImage = function() {
    const input = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
    
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        removeBtn.style.display = "inline-block";
      }
      reader.readAsDataURL(input.files[0]);
    }
  };

  // ✅ Remove image function
  window.removeImage = function() {
    const input = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
    
    input.value = "";
    preview.src = "#";
    preview.style.display = "none";
    removeBtn.style.display = "none";
  };

  // ✅ دالة التحقق من الكود
  window.verifyCode = function () {
    const code = document.getElementById("codeInput").value;

    fetch("verify.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          // Enable the right section and make the profile button
          if (rightSection) {
            rightSection.classList.add("active");
          }
          
          message.textContent = "✅ Code Verified! Now you can create your profile.";
          message.className = "verification-message success";

          // Add pulsing effect to the Make Profile button
          if (makeProfileBtn) {
            makeProfileBtn.classList.add("pulsing");
            setTimeout(() => {
              makeProfileBtn.classList.remove("pulsing");
            }, 3000);
          }

          if (window.sessionUser?.email && window.sessionUser?.password) {
            document.getElementById("profileEmail").value = window.sessionUser.email;
            document.getElementById("profilePassword").value = window.sessionUser.password;
          }
        } else {
          message.textContent = data.message;
          message.className = "verification-message error";
        }
      })
      .catch((err) => {
        message.textContent = "❌ Something went wrong.";
        message.className = "verification-message error";
        console.error(err);
      });
  };

  // ✅ دالة حفظ البروفايل بعد التحقق
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(profileForm);
      const code = document.getElementById("codeInput").value;
      formData.append("code", code);

      fetch("verify.php", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            message.textContent = data.message;
            message.className = "verification-message success";
            setTimeout(() => {
              window.location.href = data.redirect;
            }, 1500);
          } else {
            message.textContent = data.message;
            message.className = "verification-message error";
          }
        })
        .catch((err) => {
          message.textContent = "❌ Something went wrong.";
          message.className = "verification-message error";
          console.error(err);
        });
    });
  }
});