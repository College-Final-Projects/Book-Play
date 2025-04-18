document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const codeSection = document.getElementById("codeVerification");
  const profileForm = document.getElementById("profileForm");
  const message = document.getElementById("verificationMessage");

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
          document.getElementById("profileFormContainer").style.display = "block";
          document.getElementById("codeVerification").style.display = "none";
          message.textContent = "✅ Code Verified!";
          message.className = "verification-message success";

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