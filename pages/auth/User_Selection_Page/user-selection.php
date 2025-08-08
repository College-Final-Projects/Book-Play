<?php
session_start();
if (!isset($_SESSION['username'])) {
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../Login_Page/Login.php');
    exit();
}
include 'user-selection.html';
exit();
?>