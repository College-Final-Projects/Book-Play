<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit();
}

$current_user = $_SESSION['username'];

try {
    // Get all friends for the current user
    $stmt = $conn->prepare("
        SELECT 
            CASE 
                WHEN user1 = ? THEN user2 
                ELSE user1 
            END as friend_username
        FROM friends 
        WHERE user1 = ? OR user2 = ?
    ");
    $stmt->bind_param("sss", $current_user, $current_user, $current_user);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $friends = [];
    while ($row = $result->fetch_assoc()) {
        $friends[] = $row['friend_username'];
    }
    
    echo json_encode(['success' => true, 'friends' => $friends]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 