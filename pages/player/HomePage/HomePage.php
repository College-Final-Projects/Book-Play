<?php
session_start();
require_once '../../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// ✅ 1. التحقق من الطلب لجلب صورة المستخدم
if (isset($_GET['action']) && $_GET['action'] === 'get_user_image') {
    $username = $_SESSION['username'] ?? '';

    if (!$username) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    $stmt = $conn->prepare("SELECT user_image, username FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($user = $result->fetch_assoc()) {
        echo json_encode(['image' => $user['user_image'], 'username' => $user['username']]);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    exit;
}

// ✅ 2. التحقق من تسجيل الدخول وتحميل الصفحة
if (!isset($_SESSION['username'])) {
    session_unset();
    session_destroy();
<<<<<<< HEAD
    header('Location: ../../auth/Login/Login.php');
=======
    header('Location: ../../../auth/Login_Page/Login.php');
>>>>>>> 959a443ed196a3edef798af351ee8d74e088b501
    exit();
}

include 'HomePage.html';

?>