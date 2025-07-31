<?php
session_start();
require_once '../../db.php'; // المسار حسب هيكل مشروعك
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$group_id = $data['group_id'] ?? null;
$updates = $data['updates'] ?? [];

if (!$group_id || empty($updates)) {
    echo json_encode(['success' => false, 'error' => 'Missing group_id or updates']);
    exit;
}

// تأكد أن المستخدم هو فعلاً المضيف
$hostCheck = $conn->prepare("SELECT created_by FROM groups WHERE group_id = ?");
$hostCheck->bind_param("i", $group_id);
$hostCheck->execute();
$hostResult = $hostCheck->get_result();
$host = $hostResult->fetch_assoc();

if (!$host || $host['created_by'] !== $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'error' => 'Only the host can update prices']);
    exit;
}

// تحديث الأسعار في قاعدة البيانات
$stmt = $conn->prepare("UPDATE group_members SET required_payment = ? WHERE group_id = ? AND username = ?");
foreach ($updates as $u) {
    $stmt->bind_param("dis", $u['amount'], $group_id, $u['username']);
    $stmt->execute();
}


echo json_encode(['success' => true]);
?>
