<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['user_id'] ?? null;
$input = json_decode(file_get_contents("php://input"), true);

if (!$username) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$action = $input['action'] ?? null;
$friendUsername = $input['friend_username'] ?? null;

if (!$action || !$friendUsername) {
    echo json_encode(['success' => false, 'message' => 'Missing required data']);
    exit;
}

if ($action === 'accept') {
    // Accept friend request
    $stmt = $conn->prepare("UPDATE friendships SET status = 'accepted', accepted_date = NOW() WHERE user1 = ? AND user2 = ? AND status = 'pending'");
    $stmt->bind_param("ss", $friendUsername, $username);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Friend request accepted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to accept friend request']);
    }
    
} elseif ($action === 'reject') {
    // Reject friend request
    $stmt = $conn->prepare("DELETE FROM friendships WHERE user1 = ? AND user2 = ? AND status = 'pending'");
    $stmt->bind_param("ss", $friendUsername, $username);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Friend request rejected']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to reject friend request']);
    }
    
} elseif ($action === 'remove') {
    // Remove friend
    $stmt = $conn->prepare("DELETE FROM friendships WHERE ((user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)) AND status = 'accepted'");
    $stmt->bind_param("ssss", $username, $friendUsername, $friendUsername, $username);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Friend removed']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove friend']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?> 