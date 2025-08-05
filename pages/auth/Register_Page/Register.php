<?php
/**
 * User Registration System
 * 
 * This file handles the user registration process including:
 * - Email validation and duplicate checking
 * - Password hashing and security
 * - Email verification code generation and sending
 * - Session management for registration flow
 * 
 * Registration Flow:
 * 1. User submits registration form
 * 2. System validates email isn't already registered
 * 3. Generates 6-digit verification code
 * 4. Sends verification email
 * 5. Stores temporary data in session
 * 6. User completes verification in verify.php
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session and include required files
session_start(); // Start the session to track user data between requests
require_once '../../../db.php'; // Include the database connection file
require_once '../../../mail/MailLink.php'; // Include the mail utility to send verification emails

/**
 * Handle POST request for user registration
 * Processes registration form submission and sends verification email
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
   $email = $_POST['email']; // Get the email from the submitted form
   $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // Hash the password securely for storage

   // Check if email is already registered
   $checkEmail = $conn->prepare("SELECT email FROM users WHERE email = ?");
   $checkEmail->bind_param("s", $email); // Bind the email to the SQL statement
   $checkEmail->execute(); // Execute the query
   $checkEmail->store_result(); // Store the result to check the row count

   // Return error if email already exists
   if ($checkEmail->num_rows > 0) {
       echo json_encode(["status" => "error", "message" => "❌ This email is already registered."]);
       exit();
   }

   // Generate 6-digit verification code
   $code = rand(100000, 999999);

   // Store verification data in session for later use
   $_SESSION['verification_code'] = $code; // Save the verification code in session
   $_SESSION['temp_email'] = $email; // Temporarily save the email
   $_SESSION['temp_password'] = $password; // Temporarily save the hashed password

   // Send verification email to user
   if (!sendVerificationCode($email, $code)) {
       echo json_encode(["status" => "error", "message" => "❌ Failed to send email."]);
       exit();
   }

   // Return success response
   echo json_encode(["status" => "success", "message" => "✅ Verification code sent."]);
   exit();
}

/**
 * Display registration form for GET requests
 * Includes the HTML template and injects session data if available
 */
include "Register.html"; // Load the HTML form for registration

// Inject session data into JavaScript if temporary user data exists
if (isset($_SESSION['temp_email']) && isset($_SESSION['temp_password'])) {
   echo "<script>
     window.sessionUser = {
       email: '" . $_SESSION['temp_email'] . "', // Assign session email to JS
       password: '" . $_SESSION['temp_password'] . "' // Assign session password to JS
     };
   </script>";
}

exit(); // Final exit to prevent further execution
?>
