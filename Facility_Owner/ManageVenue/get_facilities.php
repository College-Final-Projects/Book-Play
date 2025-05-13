<?php
session_start();
require_once '../../db.php';

// تأكد من تسجيل دخول المستخدم
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'User not logged in']);
    exit();
}

$username = $_SESSION['user_id'];

// استرجاع المرافق المقبولة فقط للمستخدم الحالي
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE owner_username = ? AND is_Accepted = 1");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$facilities = [];
while ($row = $result->fetch_assoc()) {
    $facilities[] = $row;
}

// إرجاع النتيجة كـ JSON
header('Content-Type: application/json');
echo json_encode($facilities);
?>