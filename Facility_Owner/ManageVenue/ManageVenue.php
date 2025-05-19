<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../Login_Page/Login.php');
    exit();
}

include 'ManageVenue.html';
?>