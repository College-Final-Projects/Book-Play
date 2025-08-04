<?php
session_start();
require_once '../../../db.php';

if (!isset($_SESSION['user_id'])) {
<<<<<<< HEAD
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../../Login_Page/Login.php');
    exit();
}
include 'Chats.html';
exit();
=======
    header('Location: ../../../auth/Login_Page/Login.php');
    exit();
}

include '../navbar.html';
include 'Chats.html';
>>>>>>> 959a443ed196a3edef798af351ee8d74e088b501
?>