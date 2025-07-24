<?php
session_start();
require_once '../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['user_id'] ?? '';
$groupId = $_POST['group_id'] ?? null;
$privacy = $_POST['privacy'] ?? null;

if (!$username) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

if (!$groupId || ($privacy !== 'public' && $privacy !== 'private')) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Verify that the current user is the group admin
$stmt = $conn->prepare('SELECT created_by, group_password FROM groups WHERE group_id = ?');
$stmt->bind_param('i', $groupId);
$stmt->execute();
$result = $stmt->get_result();
$group = $result->fetch_assoc();
$stmt->close();

if (!$group || $group['created_by'] !== $username) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$groupPassword = null;
if ($privacy === 'private') {
    // keep existing password if already set
    $groupPassword = $group['group_password'] ?? null;
}

$stmt = $conn->prepare('UPDATE groups SET privacy = ?, group_password = ? WHERE group_id = ?');
$stmt->bind_param('ssi', $privacy, $groupPassword, $groupId);
$success = $stmt->execute();
$stmt->close();

echo json_encode(['success' => $success]);
?>
