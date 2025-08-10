<?php
session_start();
header('Content-Type: application/json');
require_once '../../../db.php';

try {
    $currentUsername = $_SESSION['username'] ?? '';
    if (empty($currentUsername)) {
        throw new Exception('User not authenticated');
    }
    
    $targetUsername = $_POST['target_username'] ?? '';
    if (empty($targetUsername)) {
        throw new Exception('Target username is required');
    }
    
    // Check if they are already friends
    $sql = "SELECT COUNT(*) as is_friend FROM friends 
            WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $currentUsername, $targetUsername, $targetUsername, $currentUsername);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    $isFriend = $row['is_friend'] > 0;
    
    echo json_encode([
        'success' => true, 
        'is_friend' => $isFriend,
        'message' => $isFriend ? 'Already friends' : 'Not friends'
    ]);
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error checking friend status: ' . $e->getMessage()]);
}

$conn->close();
?>
