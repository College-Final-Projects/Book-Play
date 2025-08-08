<?php
/**
 * Login Process Handler
 * 
 * This file handles user authentication by processing login form submissions.
 * It supports two user types: regular users and facility owners.
 * 
 * Authentication Flow:
 * 1. Validates form data
 * 2. Checks owner table first (by email)
 * 3. Checks users table (by username)
 * 4. Verifies password and sets session
 * 5. Redirects to appropriate dashboard
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session and include database connection
session_start();
require_once '../../../db.php'; 

// Initialize response array
$response = ['success' => false, 'message' => ''];

// Process POST request for login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = $_POST['username'];  // Can be username or email
    $password = $_POST['password'];

    // Validate input fields
    if (empty($identifier) || empty($password)) {
        $response['message'] = 'Please fill in all required fields';
    } else {
        $user = null;
        $role = null;

        // 🔎 First check in the owner table by owner_email
        $stmt = $conn->prepare("SELECT * FROM owner WHERE owner_email = ? LIMIT 1");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            $role = 'owner';
        }
        $stmt->close();

        // 🔎 If not found, check in the users table by username only
        if (!$user) {
            $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
            $stmt->bind_param("s", $identifier);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                $role = 'user';
            }
            $stmt->close();
        }

        // Process authentication if user found
        if ($user) {
            if (password_verify($password, $user['password'])) {
                // Set session variables based on user role
                $_SESSION['role'] = $role;

                if ($role === 'owner') {
                    // Owner authentication - redirect to owner dashboard
                    $_SESSION['username'] = $user['owner_email'];
                    $_SESSION['fullName'] = 'Administrator';
                    $response['redirect'] = '../../Owner/Owner.php';
                } else {
                    // Regular user authentication - redirect to user selection
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['fullName'] = $user['first_name'] . ' ' . $user['last_name'];
                    $response['redirect'] = '../User_Selection_Page/user-selection.php';
                }

                $response['success'] = true;
                $response['message'] = '✅ Login successful!';
            } else {
                $response['message'] = '❌ Incorrect password';
            }
        } else {
            $response['message'] = '❌ User not found';
        }
    }
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response);
$conn->close();
?>