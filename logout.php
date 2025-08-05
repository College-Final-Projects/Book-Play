<?php
/**
 * User Logout Handler
 * 
 * This file handles user logout functionality by destroying the session
 * and redirecting users back to the login page.
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session to access session variables
session_start();

// (Optional) Log logout time to database or file for audit purposes

// Clear all session variables
session_unset();

// Destroy the session completely
session_destroy();

// Redirect to login page
header("Location: pages/auth/Login_Page/Login.php");
exit;
?>