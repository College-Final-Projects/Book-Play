<?php
session_start();

// التحقق من تسجيل دخول المستخدم
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../Login_Page/Login.php');
    exit();
}

include 'ManageVenue.html';
?>