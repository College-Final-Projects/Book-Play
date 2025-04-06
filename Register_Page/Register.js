document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const codeSection = document.getElementById("codeVerification");
  const makeProfileBtn = document.getElementById("makeProfileBtn");
  const profileForm = document.getElementById("profileForm");
  const message = document.getElementById("verificationMessage");
  const backButton = document.getElementById("backBtn");

  // عند إرسال نموذج التسجيل
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault(); // يمنع الإرسال

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match, please double-check.");
      return;
    }

    // إخفاء نموذج التسجيل وعرض إدخال الكود
    registerForm.style.display = "none";
    codeSection.style.display = "block";
  });

  // التحقق من الكود
  window.verifyCode = function () {
    const code = document.getElementById("codeInput").value;
    if (code === "1234") {
      document.getElementById("profileEmail").value = document.getElementById("email").value;
      document.getElementById("profilePassword").value = document.getElementById("password").value;

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

  // عرض نموذج البروفايل
  makeProfileBtn.addEventListener("click", () => {
    document.getElementById("leftSection").style.display = "none";
    profileForm.style.display = "block";
    makeProfileBtn.style.display = "none";
  });

  // الرجوع إلى زر make profile
  backButton.addEventListener("click", () => {
    profileForm.style.display = "none";
    makeProfileBtn.style.display = "inline-block";
  });

  // معاينة الصورة
  window.previewImage = function () {
    const file = document.getElementById("profileImage").files[0];
    const preview = document.getElementById("profileImagePreview");
    if (file) {
      preview.src = URL.createObjectURL(file);
    }
  };



  window.previewImage = function () {
    const fileInput = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
  
    const file = fileInput.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      removeBtn.style.display = "inline-block";
    }
  };
  
  window.removeImage = function () {
    const fileInput = document.getElementById("profileImage");
    const preview = document.getElementById("profileImagePreview");
    const removeBtn = document.getElementById("removeImageBtn");
  
    fileInput.value = '';
    preview.src = '#';
    preview.style.display = "none";
    removeBtn.style.display = "none";
  };
  

  document.addEventListener("DOMContentLoaded", function () {
  fetch("get_sports.php")
    .then(response => response.text())
    .then(data => {
      document.getElementById("favoriteSport").innerHTML = data;
    })
    .catch(error => {
      console.error("Error loading sports:", error);
    });
});

});
