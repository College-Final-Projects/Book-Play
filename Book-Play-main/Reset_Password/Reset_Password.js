/**
* Password Reset Flow - Client-side implementation
* 
* This script handles the 3-step password reset process:
* 1. Email submission and verification code sending
* 2. Verification code validation
* 3. New password creation and submission
*/

document.addEventListener("DOMContentLoaded", function () {
 // Get DOM elements for input fields
 const emailInput = document.getElementById("email");
 const codeInput = document.getElementById("code");
 const newPasswordInput = document.getElementById("password");
 const confirmPasswordInput = document.getElementById("confirmPassword");
 const message = document.getElementById("message");
 const messageStep1 = document.getElementById("message-step1");
const messageStep2 = document.getElementById("message-step2");
const messageStep3 = document.getElementById("message-step3");

 // Get DOM elements for the different steps of the reset flow
 const step1 = document.getElementById("step1");
 const step2 = document.getElementById("step2");
 const step3 = document.getElementById("step3");

 /**
  * Controls which step of the password reset flow is visible
  * @param {number} stepNumber - The step to display (1, 2, or 3)
  */
window.showStep = function(stepNumber){
  step1.style.display = stepNumber === 1 ? "block" : "none";
  step2.style.display = stepNumber === 2 ? "block" : "none";
  step3.style.display = stepNumber === 3 ? "block" : "none";

  // Clear all messages
  messageStep1.textContent = "";
  messageStep2.textContent = "";
  messageStep3.textContent = "";
};

 // Initialize the flow at step 1
 showStep(1);

 /**
  * Sends a verification code to the provided email
  * This function is called when the "Send Code" button is clicked
  */
window.sendCode = function () {
  const email = emailInput.value.trim();
  messageStep1.textContent = "";

  if (!email) {
    messageStep1.textContent = "📭 Please enter your email.";
    return;
  }

  // ✅ Show "Verifying..." message
  messageStep1.textContent = "⏳ Verifying email...";

  fetch("send_code.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "send_code", email })
  })
  .then(res => res.json())
  .then(data => {
    messageStep1.textContent = data.message;
    if (data.success) showStep(2);
  })
  .catch(() => {
    messageStep1.textContent = "❌ Could not send verification code.";
  });
};


 /**
  * Verifies the code entered by the user
  * Event listener for the "Verify Code" button
  */
document.getElementById("verifyCodeBtn").addEventListener("click", function () {
  const code = codeInput.value.trim();
  messageStep2.textContent = "";

  if (!code) {
    messageStep2.textContent = "⛔ Please enter the code.";
    return;
  }

  // ✅ Show "Verifying..." message
  messageStep2.textContent = "🔍 Verifying code...";

  fetch("send_code.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "verify_code", code })
  })
  .then(res => res.json())
  .then(data => {
    messageStep2.textContent = data.message;
    if (data.success) showStep(3);
  })
  .catch(() => {
    messageStep2.textContent = "❌ Verification failed.";
  });
});


 /**
  * Submits the new password to the server
  * Event listener for the "Reset Password" button
  */
document.getElementById("resetbtn").addEventListener("click", function () {
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  messageStep3.textContent = "";

  if (!newPassword || !confirmPassword) {
    messageStep3.textContent = "⚠️ Please fill out both password fields.";
    return;
  }

  if (newPassword !== confirmPassword) {
    messageStep3.textContent = "❗ Passwords do not match.";
    return;
  }

  fetch("send_code.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "reset_password",
      password: newPassword,
      confirmPassword: confirmPassword
    })
  })
  .then(res => res.json())
  .then(data => {
    messageStep3.textContent = data.message;
    if (data.success) {
      messageStep3.textContent += " Redirecting...";
      setTimeout(() => {
        window.location.href = "../Login_Page/Login.php";
      }, 2000);
    }
  })
  .catch(() => {
    messageStep3.textContent = "❌ Failed to reset password.";
  });
});  
});