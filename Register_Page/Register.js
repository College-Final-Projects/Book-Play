document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm");
    const codeSection = document.getElementById("codeVerification");
    const makeProfileBtn = document.getElementById("makeProfileBtn");
    const profileForm = document.getElementById("profileForm");
    const message = document.getElementById("verificationMessage");
    const backButton = document.getElementById("backBtn");
  

    const registerForm = document.getElementById("registerForm");
    registerForm.addEventListener("submit", function (e) {
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
  
      if (password !== confirmPassword) {
        e.preventDefault(); // يمنع الإرسال
        alert("❌ Passwords do not match, please double-check."); // Or use a custom message element    
          }


    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.style.display = "none";
      codeSection.style.display = "block";
    });
  
    window.verifyCode = function () {
      const code = document.getElementById("codeInput").value;
      if (code === "1234") {
        // نسخ البيانات من نموذج التسجيل إلى نموذج البروفايل
        document.getElementById("profileEmail").value = document.getElementById("email").value;
        document.getElementById("profilePassword").value = document.getElementById("password").value;
        

  // تفعيل زر إنشاء البروفايل
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
     
      document.getElementById("leftSection").style.display = "none";
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

  }
);
});

  