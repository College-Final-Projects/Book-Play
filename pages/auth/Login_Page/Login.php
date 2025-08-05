<?php
/**
 * Login Page Controller
 * 
 * This file serves as the main entry point for the login page.
 * It starts a session and includes the login HTML template.
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session for user authentication
session_start();

// Include the login page HTML template
include 'Login.html';
exit();
?>