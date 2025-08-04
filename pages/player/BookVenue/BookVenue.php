<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../auth/Login_Page/Login.php');
    exit();
}
require_once '../../../components/sports-scroll.php';

include '../navbar.php';
include 'BookVenue.html';
?>
