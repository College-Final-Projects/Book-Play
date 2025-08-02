<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../../Login_Page/Login.php');
    exit();
}
include 'Bookings.html';
exit();
?>