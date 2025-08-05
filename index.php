<?php
/**
 * BOOK-PLAY Application Entry Point
 * 
 * This file serves as the main entry point for the BOOK-PLAY application.
 * It automatically redirects users to the login page when they access the root URL.
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Redirect to login page - all users must authenticate first
header("Location: pages/auth/Login_Page/Login.php");
exit();
?>