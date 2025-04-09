document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const codeSection = document.getElementById("codeVerification");
  const message = document.getElementById("verificationMessage");

  // إرسال نموذج التسجيل
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

  // التحقق من الكود
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
});
