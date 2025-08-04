<?php
session_start();
require_once '../../../db.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../../../auth/Login_Page/Login.php');
    exit();
}

include '../navbar.html';
include 'Chats.html';
?>