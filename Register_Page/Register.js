document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm");
    const codeSection = document.getElementById("codeVerification");
    const makeProfileBtn = document.getElementById("makeProfileBtn");
    const profileForm = document.getElementById("profileForm");
    const message = document.getElementById("verificationMessage");
    const backButton = document.getElementById("backBtn");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.style.display = "none";
      codeSection.style.display = "block";
    });
  
    window.verifyCode = function () {
      const code = document.getElementById("codeInput").value;
      if (code === "1234") {
        document.getElementById("leftSection").style.display = "none";
        document.getElementById("rightSection").classList.add("active");
        makeProfileBtn.classList.remove("disabled");
        makeProfileBtn.disabled = false;
        message.textContent = "✅ Code Verified!";
        message.className = "verification-message success";
      } else {
        message.textContent = "❌ Incorrect Code!";
        message.className = "verification-message error";
      }
    };
  
    makeProfileBtn.addEventListener("click", () => {
      profileForm.style.display = "block";
      makeProfileBtn.style.display = "none";
    });
  
    backButton.addEventListener("click", () => {
      profileForm.style.display = "none";
      makeProfileBtn.style.display = "inline-block";
    });
  
    // Image Preview
    window.previewImage = function () {
      const file = document.getElementById("profileImage").files[0];
      const preview = document.getElementById("profileImagePreview");
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    };
    const playerIcon = document.getElementById("playerIcon");
    playerIcon.style.display = "none";

  });
  