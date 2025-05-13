<?php
// Start session to maintain user state across requests
session_start();
// Connect to database
require_once '../db.php';
// Include email sending functionality
require_once '../mail/MailLink.php';

// Set response header to JSON
header('Content-Type: application/json');

// Get the requested action from POST data (with null coalescing operator)
$action = $_POST['action'] ?? '';

// SECTION 1: SEND VERIFICATION CODE
// Handles sending a verification code to the user's email for password reset
if ($action === 'send_code') {
   // Get email from POST data
   $email = $_POST['email'] ?? '';

   // Validate email is not empty
   if (empty($email)) {
       echo json_encode(["success" => false, "message" => "📭 Please enter your email."]);
       exit;
   }

   // Check if email exists in the database
   $stmt = $conn->prepare("SELECT username FROM users WHERE email = ?");
   $stmt->bind_param("s", $email);
   $stmt->execute();
   $result = $stmt->get_result();

   // If email not found, return error
   if ($result->num_rows === 0) {
       echo json_encode(["success" => false, "message" => "❌ Email not registered."]);
       exit;
   }
   
   // Get the username associated with the email
   $row = $result->fetch_assoc();
   $_SESSION['username'] = $row['username']; // Store username in session
   
   // Generate a random 6-digit verification code
   $code = rand(100000, 999999);
   
   // Store code and email in session for later verification
   $_SESSION['reset_code'] = $code;
   $_SESSION['reset_email'] = $email;

   // Send verification code email and return appropriate response
   if (sendVerificationCode($email, $code)) {
       echo json_encode(["success" => true, "message" => "✅ Verification code sent."]);
   } else {
       echo json_encode(["success" => false, "message" => "❌ Failed to send email."]);
   }
   exit;
}

// SECTION 2: VERIFY CODE
// Validates the verification code entered by the user
if ($action === 'verify_code') {
   // Get code from POST data
   $code = $_POST['code'] ?? '';

   // Check if code matches the one stored in session
   if (!isset($_SESSION['reset_code']) || $code != $_SESSION['reset_code']) {
       echo json_encode(["success" => false, "message" => "❌ Incorrect verification code."]);
   } else {
       echo json_encode(["success" => true, "message" => "✅ Code verified."]);
   }
   exit;
}

// SECTION 3: RESET PASSWORD
// Handles the actual password reset after verification
if ($action === 'reset_password') {
   // Get password data from POST
   $newPassword = $_POST['password'] ?? '';
   $confirmPassword = $_POST['confirmPassword'] ?? '';

   // Validate that passwords match
   if ($newPassword !== $confirmPassword) {
       echo json_encode(["success" => false, "message" => "❌ Passwords do not match."]);
       exit;
   }

   // Ensure session is still valid
   if (!isset($_SESSION['reset_email'])) {
       echo json_encode(["success" => false, "message" => "⏳ Session expired. Try again."]);
       exit;
   }

   // Hash the new password for security
   $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
   $email = $_SESSION['reset_email'];

   // Update the password in the database
   $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
   $stmt->bind_param("ss", $hashedPassword, $email);

   // Execute query and return appropriate response
   if ($stmt->execute()) {
       // Clear session variables for security
       unset($_SESSION['reset_email'], $_SESSION['reset_code']);
       echo json_encode(["success" => true, "message" => "✅ Password updated."]);
   } else {
       echo json_encode(["success" => false, "message" => "❌ Failed to update password."]);
   }
   exit;
}

// If no valid action was specified, return error
echo json_encode(["success" => false, "message" => "⛔ Invalid action."]);
exit;
?>