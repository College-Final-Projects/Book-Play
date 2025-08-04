<?php
<<<<<<< HEAD
session_start();
require_once '../../../db.php';
=======
include  '../navbar.php';
include  'FindPlayer.html';
>>>>>>> 959a443ed196a3edef798af351ee8d74e088b501

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