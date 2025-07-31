<?php
session_start();
require_once '../../db.php';

header('Content-Type: application/json');

$user = $_SESSION['user_id'] ?? null;
$groupId = $_POST['group_id'] ?? null;
$newPassword = $_POST['new_password'] ?? null;

if (!$user || !$groupId || !$newPassword) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

// تحقق أن المستخدم هو الـ Host
$sql = "SELECT created_by FROM groups WHERE group_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $groupId);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row || $row['created_by'] !== $user) {
    echo json_encode(['success' => false, 'error' => 'Only the host can update the password']);
    exit;
}

// تحديث كلمة المرور
$updateSql = "UPDATE groups SET group_password = ? WHERE group_id = ?";
$updateStmt = $conn->prepare($updateSql);
$updateStmt->bind_param("si", $newPassword, $groupId);
$success = $updateStmt->execute();

echo json_encode(['success' => $success]);
?>
