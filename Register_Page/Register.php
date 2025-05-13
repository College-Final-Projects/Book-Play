<?php
session_start();
require_once '../db.php';
require_once '../mail/MailLink.php';

/**
* User Registration System
* 
* This script handles the first step of the user registration process:
* 1. Validates that the email is not already registered
* 2. Generates a verification code
* 3. Sends the code to the user's email
* 4. Stores temporary registration data in the session
*/

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
   // Get and validate email, hash password for security
   $email = $_POST['email'];
   $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

   // Check if email already exists in database
   $checkEmail = $conn->prepare("SELECT email FROM users WHERE email = ?");
   $checkEmail->bind_param("s", $email);
   $checkEmail->execute();
   $checkEmail->store_result();

   // Return error if email already registered
   if ($checkEmail->num_rows > 0) {
       echo json_encode(["status" => "error", "message" => "❌ This email is already registered."]);
       exit();
   }

   // Generate 6-digit verification code
   $code = rand(100000, 999999);
   
   // Store temporary registration data in session
   $_SESSION['verification_code'] = $code;
   $_SESSION['temp_email'] = $email;
   $_SESSION['temp_password'] = $password;

   // Send verification code to user's email
   if (!sendVerificationCode($email, $code)) {
       echo json_encode(["status" => "error", "message" => "❌ Failed to send email."]);
       exit();
   }

   // Return success response
   echo json_encode(["status" => "success", "message" => "✅ Verification code sent."]);
   exit();
}

// Display registration interface
include "register.html";

// If user has started the registration process, inject their data into page
// This allows the form to remember user data between page loads
if (isset($_SESSION['temp_email']) && isset($_SESSION['temp_password'])) {
   echo "<script>
     window.sessionUser = {
       email: '" . $_SESSION['temp_email'] . "',
       password: '" . $_SESSION['temp_password'] . "'
     };
   </script>";
}

exit();
?>