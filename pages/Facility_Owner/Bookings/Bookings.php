<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../../auth/Login_Page/Login.php');
    exit();
}
include '../navbar.php';
include 'Bookings.html';
exit();
?>