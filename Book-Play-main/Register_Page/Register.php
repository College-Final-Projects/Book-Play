<?php
session_start(); // Start the session to track user data between requests
require_once '../db.php'; // Include the database connection file
require_once '../mail/MailLink.php'; // Include the mail utility to send verification emails

/**
 * User Registration System
 *
 * This script performs the following:
 * 1. Validates the submitted email isn't already registered
 * 2. Generates a random verification code
 * 3. Sends the code to the user's email
 * 4. Stores the email and password temporarily in the session
 */

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
   $email = $_POST['email']; // Get the email from the submitted form
   $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // Hash the password securely for storage

   // Prepare a SQL query to check if the email already exists
   $checkEmail = $conn->prepare("SELECT email FROM users WHERE email = ?");
   $checkEmail->bind_param("s", $email); // Bind the email to the SQL statement
   $checkEmail->execute(); // Execute the query
   $checkEmail->store_result(); // Store the result to check the row count

   // If the email already exists, return an error
   if ($checkEmail->num_rows > 0) {
       echo json_encode(["status" => "error", "message" => "❌ This email is already registered."]); // Email in use
       exit(); // Terminate the script
   }

   $code = rand(100000, 999999); // Generate a 6-digit random verification code

   // Store the verification code and user credentials in the session
   $_SESSION['verification_code'] = $code; // Save the verification code in session
   $_SESSION['temp_email'] = $email; // Temporarily save the email
   $_SESSION['temp_password'] = $password; // Temporarily save the hashed password

   // Attempt to send the verification code to the email address
   if (!sendVerificationCode($email, $code)) {
       echo json_encode(["status" => "error", "message" => "❌ Failed to send email."]); // Email sending failed
       exit(); // Terminate the script
   }

   echo json_encode(["status" => "success", "message" => "✅ Verification code sent."]); // Return success message
   exit(); // End the script
}

// If the request is not POST, include the registration form
include "register.html"; // Load the HTML form for registration

// If temporary user data exists in session, inject it into the page using JavaScript
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
