<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$currentUser = $_SESSION['username'] ?? '';
$groupId = $_POST['group_id'] ?? null;
$newHost = $_POST['username'] ?? null;

if (!$currentUser) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

if (!$groupId || !$newHost) {
    echo json_encode(['success' => false, 'error' => 'Missing required data']);
    exit;
}

// Verify that the current user is the current host
$stmt = $conn->prepare("SELECT created_by FROM groups WHERE group_id = ?");
$stmt->bind_param("i", $groupId);
$stmt->execute();
$result = $stmt->get_result();
$group = $result->fetch_assoc();
$stmt->close();

if (!$group || $group['created_by'] !== $currentUser) {
    echo json_encode(['success' => false, 'error' => 'Only the host can transfer host privileges']);
    exit;
}

// Verify that the new host is a member of the group
$stmt = $conn->prepare("SELECT username FROM group_members WHERE group_id = ? AND username = ?");
$stmt->bind_param("is", $groupId, $newHost);
$stmt->execute();
$result = $stmt->get_result();
$member = $result->fetch_assoc();
$stmt->close();

if (!$member) {
    echo json_encode(['success' => false, 'error' => 'User is not a member of this group']);
    exit;
}

// Update the group creator (host)
$stmt = $conn->prepare("UPDATE groups SET created_by = ? WHERE group_id = ?");
$stmt->bind_param("si", $newHost, $groupId);
$success = $stmt->execute();
$stmt->close();

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Host transferred successfully']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to update host: ' . $conn->error]);
}
?>