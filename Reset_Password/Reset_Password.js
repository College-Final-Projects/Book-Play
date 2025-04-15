document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("email");
  const codeInput = document.getElementById("code");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const message = document.getElementById("message");

  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");

  function showStep(stepNumber) {
    step1.style.display = stepNumber === 1 ? "block" : "none";
    step2.style.display = stepNumber === 2 ? "block" : "none";
    step3.style.display = stepNumber === 3 ? "block" : "none";
    message.textContent = "";
  }

  showStep(1);

  window.sendCode = function () {
    const email = emailInput.value.trim();

    if (!email) {
      message.textContent = "📭 Please enter your email.";
      return;
    }

    fetch("send_code.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "send_code",
        email: email,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        message.textContent = data.message;
        if (data.success) {
          showStep(2);
        }
      })
      .catch((err) => {
        message.textContent = "❌ Something went wrong.";
        console.error(err);
      });
  };

  document.getElementById("verifyCodeBtn").addEventListener("click", function () {
    const code = codeInput.value.trim();

    fetch("send_code.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "verify_code",
        code: code,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        message.textContent = data.message;
        if (data.success) {
          showStep(3);
        }
      })
      .catch((err) => {
        message.textContent = "❌ Verification failed.";
        console.error(err);
      });
  });

  window.resetPassword = function () {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    fetch("send_code.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "reset_password",
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        message.textContent = data.message;
        if (data.success) {
          message.textContent += " Redirecting to login...";
          setTimeout(() => {
            window.location.href = "../Login_Page/Login.php";
          }, 2000);
        }
      })
      .catch((err) => {
        message.textContent = "❌ Failed to reset password.";
        console.error(err);
      });
  };
});
