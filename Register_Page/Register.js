// Register.js

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const codeSection = document.getElementById("codeVerification");
  const message = document.getElementById("verificationMessage");

  const makeProfileBtn = document.querySelector(".make-profile-btn");
  makeProfileBtn.addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("leftSection").style.display = "none";
    document.getElementById("rightSection").style.display = "none";
    document.getElementById("profileFormContainer").style.display = "flex";

    // Copy email and password to hidden inputs
    document.getElementById("profileEmail").value = document.getElementById("email").value;
    document.getElementById("profilePassword").value = document.getElementById("password").value;
  });

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (password !== confirmPassword) {
      alert("❌ Passwords do not match, please double-check.");
      return;
    }
    registerForm.style.display = "none";
    codeSection.style.display = "block";
  });

  window.verifyCode = function () {
    const code = document.getElementById("codeInput").value;
    if (code === "1234") {
      document.getElementById("rightSection").classList.add("active");
      document.querySelector(".make-profile-btn").style.display = "inline-block";
      message.textContent = "✅ Code Verified!";
      message.className = "verification-message success";
    } else {
      message.textContent = "❌ Incorrect Code!";
      message.className = "verification-message error";
    }
  };

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

    input.value = "";
    preview.src = "#";
    preview.style.display = "none";
    removeBtn.style.display = "none";
  };

  // Only numbers in phone input
  const phoneInput = document.getElementById("phone");
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^\d]/g, "").slice(0, 10);
  });

  // Only letters in first and last name
  const nameFields = [
    document.getElementById("firstName"),
    document.getElementById("lastName")
  ];

  nameFields.forEach(field => {
    field.addEventListener("input", function () {
      this.value = this.value.replace(/[^a-zA-Z]/g, "");
    });
  });
});
