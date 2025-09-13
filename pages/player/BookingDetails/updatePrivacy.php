<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['username'] ?? '';
$groupId = $_POST['group_id'] ?? null;
$privacy = $_POST['privacy'] ?? null;
$action = $_POST['action'] ?? null;

if (!$username) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

if (!$groupId) {
    echo json_encode(['success' => false, 'error' => 'Missing group ID']);
    exit;
}

// Handle different actions
if ($action === 'change_password') {
    // Handle password change action
    handlePasswordChange($conn, $groupId, $username);
    exit;
}

if ($action === 'save_custom_password') {
    // Handle custom password save action
    handleSaveCustomPassword($conn, $groupId, $username, $_POST['password'] ?? '');
    exit;
}

if ($privacy !== 'public' && $privacy !== 'private') {
    echo json_encode(['success' => false, 'error' => 'Invalid privacy setting']);
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
    // Generate new password if switching to private, or keep existing
    $groupPassword = $group['group_password'] ?? null;
    if (empty($groupPassword)) {
        // Generate a random password
        $groupPassword = 'BP' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6)) . '-' . rand(1000, 9999);
    }
}

$stmt = $conn->prepare('UPDATE groups SET privacy = ?, group_password = ? WHERE group_id = ?');
$stmt->bind_param('ssi', $privacy, $groupPassword, $groupId);
$success = $stmt->execute();
$stmt->close();

echo json_encode(['success' => $success]);

function handlePasswordChange($conn, $groupId, $username) {
    // Verify that the current user is the group admin
    $stmt = $conn->prepare('SELECT created_by, privacy FROM groups WHERE group_id = ?');
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $username) {
        echo json_encode(['success' => false, 'error' => 'Only the host can change the password']);
        return;
    }

    // Check if room is private
    if ($group['privacy'] !== 'private') {
        echo json_encode(['success' => false, 'error' => 'Can only change password for private rooms']);
        return;
    }

    // Generate a new random password
    $newPassword = 'BP' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6)) . '-' . rand(1000, 9999);

    // Update the group password
    $stmt = $conn->prepare('UPDATE groups SET group_password = ? WHERE group_id = ?');
    $stmt->bind_param('si', $newPassword, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => 'Password changed successfully',
            'new_password' => $newPassword
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update password: ' . $conn->error]);
    }
}

function handleSaveCustomPassword($conn, $groupId, $username, $password) {
    // Verify that the current user is the group admin
    $stmt = $conn->prepare('SELECT created_by, privacy FROM groups WHERE group_id = ?');
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $username) {
        echo json_encode(['success' => false, 'error' => 'Only the host can change the password']);
        return;
    }

    // Check if room is private
    if ($group['privacy'] !== 'private') {
        echo json_encode(['success' => false, 'error' => 'Can only change password for private rooms']);
        return;
    }

    // Validate password
    $password = trim($password);
    if (empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Password cannot be empty']);
        return;
    }

    if (strlen($password) < 4) {
        echo json_encode(['success' => false, 'error' => 'Password must be at least 4 characters long']);
        return;
    }

    if (strlen($password) > 50) {
        echo json_encode(['success' => false, 'error' => 'Password cannot be longer than 50 characters']);
        return;
    }

    // Update the group password
    $stmt = $conn->prepare('UPDATE groups SET group_password = ? WHERE group_id = ?');
    $stmt->bind_param('si', $password, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => 'Password saved successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save password: ' . $conn->error]);
    }
}
?>