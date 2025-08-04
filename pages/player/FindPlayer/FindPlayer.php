<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    session_unset();
    session_destroy();
    header('Location: ../../../pages/auth/Login/Login.php');
    exit();
}

include '../navbar.html';
include 'FindPlayer.html';
?>