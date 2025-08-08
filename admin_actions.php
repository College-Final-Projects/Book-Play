<?php
/**
 * Admin Access Request Handler
 * 
 * This file handles admin access requests from users. It provides two main actions:
 * 1. Check current admin status and existing requests
 * 2. Submit new admin access requests
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session and include database connection
session_start();
require_once 'db.php';

// Get current user from session
$username = $_SESSION['user_id'] ?? '';

// Check if user is logged in
if (!$username) {
  echo json_encode(["success" => false, "message" => "Not logged in"]);
  exit;
}

// Get action from POST or GET request
$action = $_POST['action'] ?? $_GET['action'] ?? '';

/**
 * Check admin status and existing requests
 * Returns current admin status and whether user has already requested admin access
 */
if ($action === 'check') {
  // Check if user is already an admin
  $stmt = $conn->prepare("SELECT is_admin FROM users WHERE username = ?");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($isAdmin);
  $stmt->fetch();
  $stmt->close();

  // Check if user has already submitted an admin request
  $stmt = $conn->prepare("SELECT COUNT(*) FROM reports WHERE username = ? AND type = 'admin_request'");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($count);
  $stmt->fetch();
  $stmt->close();

  // Return admin status and request status
  echo json_encode([
    "is_admin" => $isAdmin == 1,
    "already_requested" => $count > 0
  ]);
  exit;
}

/**
 * Submit new admin access request
 * Creates a new admin request if user hasn't already submitted one
 */
if ($action === 'submit') {
  // Check if user has already submitted a request
  $stmt = $conn->prepare("SELECT COUNT(*) FROM reports WHERE username = ? AND type = 'admin_request'");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($count);
  $stmt->fetch();
  $stmt->close();

  // Prevent duplicate requests
  if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Request already exists"]);
    exit;
  }

  // Insert new admin request
  $stmt = $conn->prepare("INSERT INTO reports (username, type, message) VALUES (?, 'admin_request', 'Requesting admin access')");
  $stmt->bind_param("s", $username);
  $success = $stmt->execute();
  $stmt->close();

  echo json_encode(["success" => $success]);
  exit;
}

// Return error for invalid actions
echo json_encode(["success" => false, "message" => "Invalid action"]);
?>