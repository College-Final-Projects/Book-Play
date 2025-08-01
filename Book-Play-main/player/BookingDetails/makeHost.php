<?php
require_once '../../db.php';

$groupId = $_POST['group_id'] ?? null;
$newHost = $_POST['username'] ?? null;

if (!$groupId || !$newHost) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

$conn->query("UPDATE group_members SET is_host = 0 WHERE group_id = $groupId");

$stmt = $conn->prepare("UPDATE group_members SET is_host = 1 WHERE group_id = ? AND username = ?");
$stmt->bind_param("is", $groupId, $newHost);
$success = $stmt->execute();

echo json_encode(['success' => $success]);
?>
