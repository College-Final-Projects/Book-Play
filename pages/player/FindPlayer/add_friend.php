<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit();
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the request data
$input = json_decode(file_get_contents('php://input'), true);
$friend_username = $input['friend_username'] ?? '';

if (empty($friend_username)) {
    http_response_code(400);
    echo json_encode(['error' => 'Friend username is required']);
    exit();
}

$current_user = $_SESSION['username'];

try {
    // Check if friendship already exists
    $checkStmt = $conn->prepare("SELECT * FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)");
    $checkStmt->bind_param("ssss", $current_user, $friend_username, $friend_username, $current_user);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Friendship already exists']);
        exit();
    }
    
    // Add the friendship
    $insertStmt = $conn->prepare("INSERT INTO friends (user1, user2) VALUES (?, ?)");
    $insertStmt->bind_param("ss", $current_user, $friend_username);
    
    if ($insertStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Friend added successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add friend']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 