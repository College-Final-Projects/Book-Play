<?php
session_start();
require_once '../../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// ✅ 1. التحقق من الطلب لجلب صورة المستخدم
if (isset($_GET['action']) && $_GET['action'] === 'get_user_image') {
    $username = $_SESSION['user_id'] ?? '';

    if (!$username) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }
}
include 'VenueDetails.html';
exit;
?>