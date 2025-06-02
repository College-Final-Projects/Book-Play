<?php
session_start();
require_once '../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// ✅ 1. التحقق من الطلب لجلب صورة المستخدم
if (isset($_GET['action']) && $_GET['action'] === 'get_user_image') {
    $username = $_SESSION['user_id'] ?? '';

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
// Check if user is admin by querying the database
$user_name = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT * FROM users WHERE username  = ?");
$stmt->bind_param("s", $user_name);
$stmt->execute();
$result = $stmt->get_result();

if (!isset($_SESSION['user_id']) || $result->fetch_assoc()['is_admin'] != 1) {
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../../Login_Page/Login.php');
    exit();
}
include 'HomePage.html';
exit();
?>