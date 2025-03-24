<?php
include 'Login.html';
include '../config/connection.php'; // الاتصال بـ Firebase

if (isset($_POST['Login'])) {
    // Get form data
    $email = $_POST['username'];
    $password = $_POST['password'];

    // Validate input
    if (!empty($email) && !empty($password)) {
        // Fetch users from Firebase
        $usersRef = $database->getReference('users')->getValue();

        if ($usersRef) {
            foreach ($usersRef as $key => $user) {
                // Check if email matches
                if ($user['email'] === $email) {
                    // Check if password is correct
                    if (password_verify($password, $user['password'])) {
                        // Successful login
                        header("Location: dashboard.php"); // Redirect to dashboard
                        exit;
                    } else {
                        // Incorrect password
                        $error_message = "❌ Incorrect password!";
                    }
                }
            }
        }

        // User not found
        $error_message = "⚠️ User not found!";
    } else {
        // Form fields are empty
        $error_message = "⚠️ Please fill in all fields.";
    }
}