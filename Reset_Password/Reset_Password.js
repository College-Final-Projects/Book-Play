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
 const newPasswordInput = document.getElementById("newPassword");
 const confirmPasswordInput = document.getElementById("confirmPassword");
 const message = document.getElementById("message");

 // Get DOM elements for the different steps of the reset flow
 const step1 = document.getElementById("step1");
 const step2 = document.getElementById("step2");
 const step3 = document.getElementById("step3");

 /**
  * Controls which step of the password reset flow is visible
  * @param {number} stepNumber - The step to display (1, 2, or 3)
  */
 window.showStep = function(stepNumber){
   // Show only the current step and hide others
   step1.style.display = stepNumber === 1 ? "block" : "none";
   step2.style.display = stepNumber === 2 ? "block" : "none";
   step3.style.display = stepNumber === 3 ? "block" : "none";
   // Clear any existing messages
   message.textContent = "";
 }

 // Initialize the flow at step 1
 showStep(1);

 /**
  * Sends a verification code to the provided email
  * This function is called when the "Send Code" button is clicked
  */
 window.sendCode = function () {
   const email = emailInput.value.trim();

   // Validate email is not empty
   if (!email) {
     message.textContent = "📭 Please enter your email.";
     return;
   }

   // Send request to server to generate and send verification code
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
       // Display server response message
       message.textContent = data.message;
       // If successful, proceed to step 2 (enter verification code)
       if (data.success) {
         showStep(2);
       }
     })
     .catch((err) => {
       message.textContent = "❌ Something went wrong.";
       console.error(err);
     });
 };

 /**
  * Verifies the code entered by the user
  * Event listener for the "Verify Code" button
  */
 document.getElementById("verifyCodeBtn").addEventListener("click", function () {
   const code = codeInput.value.trim();

   // Send verification request to server
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
       // Display server response message
       message.textContent = data.message;
       // If code verification successful, proceed to step 3 (new password)
       if (data.success) {
         showStep(3);
       }
     })
     .catch((err) => {
       message.textContent = "❌ Verification failed.";
       console.error(err);
     });
 });

 /**
  * Submits the new password to the server
  * Event listener for the "Reset Password" button
  */
 document.getElementById("resetbtn").addEventListener("click", function () {
   const newPassword = newPasswordInput.value;
   const confirmPassword = confirmPasswordInput.value; 
 
   // Send password reset request to server
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
     // Display server response message
     message.textContent = data.message;
     // If password reset successful, redirect to login page
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
 });  
});