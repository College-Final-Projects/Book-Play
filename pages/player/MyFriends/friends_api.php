<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "❌ You must be logged in."]);
    exit;
}

$username = $_SESSION['username'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    
    // Send friend request
    case 'send_request':
        $friend_username = trim($_POST['friend_username'] ?? '');
        
        if (empty($friend_username)) {
            echo json_encode(["success" => false, "message" => "❌ Friend username is required."]);
            exit;
        }
        
        if ($username === $friend_username) {
            echo json_encode(["success" => false, "message" => "❌ You cannot send a friend request to yourself."]);
            exit;
        }
        
        // Check if friend request already exists
        $check_stmt = $conn->prepare("SELECT * FROM friend_requests WHERE (from_username = ? AND to_username = ?) OR (from_username = ? AND to_username = ?)");
        $check_stmt->bind_param("ssss", $username, $friend_username, $friend_username, $username);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "❌ Friend request already exists."]);
            $check_stmt->close();
            exit;
        }
        $check_stmt->close();
        
        // Check if already friends
        $friends_check = $conn->prepare("SELECT * FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)");
        $friends_check->bind_param("ssss", $username, $friend_username, $friend_username, $username);
        $friends_check->execute();
        $friends_result = $friends_check->get_result();
        
        if ($friends_result->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "❌ You are already friends with this user."]);
            $friends_check->close();
            exit;
        }
        $friends_check->close();
        
        // Insert friend request
        $stmt = $conn->prepare("INSERT INTO friend_requests (from_username, to_username, status, created_at) VALUES (?, ?, 'pending', NOW())");
        $stmt->bind_param("ss", $username, $friend_username);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "✅ Friend request sent successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to send friend request."]);
        }
        $stmt->close();
        break;
    
    // Accept friend request
    case 'accept_request':
        $request_id = intval($_POST['request_id'] ?? 0);
        
        if ($request_id <= 0) {
            echo json_encode(["success" => false, "message" => "❌ Invalid request ID."]);
            exit;
        }
        
        // Get request details
        $get_request = $conn->prepare("SELECT * FROM friend_requests WHERE id = ? AND to_username = ? AND status = 'pending'");
        $get_request->bind_param("is", $request_id, $username);
        $get_request->execute();
        $request_result = $get_request->get_result();
        
        if ($request_result->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "❌ Friend request not found or already processed."]);
            $get_request->close();
            exit;
        }
        
        $request_data = $request_result->fetch_assoc();
        $from_username = $request_data['from_username'];
        $get_request->close();
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Add to friends table
            $add_friend = $conn->prepare("INSERT INTO friends (user1, user2) VALUES (?, ?)");
            $add_friend->bind_param("ss", $username, $from_username);
            $add_friend->execute();
            $add_friend->close();
            
            // Update request status
            $update_request = $conn->prepare("UPDATE friend_requests SET status = 'accepted', updated_at = NOW() WHERE id = ?");
            $update_request->bind_param("i", $request_id);
            $update_request->execute();
            $update_request->close();
            
            $conn->commit();
            echo json_encode(["success" => true, "message" => "✅ Friend request accepted!"]);
            
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "❌ Failed to accept friend request."]);
        }
        break;
    
    // Reject friend request
    case 'reject_request':
        $request_id = intval($_POST['request_id'] ?? 0);
        
        if ($request_id <= 0) {
            echo json_encode(["success" => false, "message" => "❌ Invalid request ID."]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE friend_requests SET status = 'rejected', updated_at = NOW() WHERE id = ? AND to_username = ?");
        $stmt->bind_param("is", $request_id, $username);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "✅ Friend request rejected."]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to reject friend request."]);
        }
        $stmt->close();
        break;
    
    // Get friend requests
    case 'get_requests':
        $stmt = $conn->prepare("
            SELECT fr.*, u.first_name, u.last_name, u.email, u.user_image, u.description, u.age, u.Gender
            FROM friend_requests fr
            JOIN users u ON fr.from_username = u.username
            WHERE fr.to_username = ? AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        ");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $requests = [];
        while ($row = $result->fetch_assoc()) {
            $requests[] = $row;
        }
        $stmt->close();
        
        echo json_encode(["success" => true, "requests" => $requests]);
        break;
    
    // Get current friends
    case 'get_friends':
        $stmt = $conn->prepare("
            SELECT u.username, u.first_name, u.last_name, u.email, u.user_image, u.description, u.age, u.Gender
            FROM friends f
            JOIN users u ON (f.user1 = u.username OR f.user2 = u.username)
            WHERE (f.user1 = ? OR f.user2 = ?) AND u.username != ?
            ORDER BY u.first_name, u.last_name
        ");
        $stmt->bind_param("sss", $username, $username, $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $friends = [];
        while ($row = $result->fetch_assoc()) {
            $friends[] = $row;
        }
        $stmt->close();
        
        echo json_encode(["success" => true, "friends" => $friends]);
        break;
    
    // Get friend counts
    case 'get_counts':
        // Count current friends
        $friends_count = $conn->prepare("SELECT COUNT(*) as count FROM friends WHERE user1 = ? OR user2 = ?");
        $friends_count->bind_param("ss", $username, $username);
        $friends_count->execute();
        $friends_result = $friends_count->get_result();
        $friends_count_num = $friends_result->fetch_assoc()['count'];
        $friends_count->close();
        
        // Count pending requests
        $requests_count = $conn->prepare("SELECT COUNT(*) as count FROM friend_requests WHERE to_username = ? AND status = 'pending'");
        $requests_count->bind_param("s", $username);
        $requests_count->execute();
        $requests_result = $requests_count->get_result();
        $requests_count_num = $requests_result->fetch_assoc()['count'];
        $requests_count->close();
        
        echo json_encode([
            "success" => true, 
            "friends_count" => $friends_count_num,
            "requests_count" => $requests_count_num
        ]);
        break;
    
    // Remove friend
    case 'remove_friend':
        $friend_username = trim($_POST['friend_username'] ?? '');
        
        if (empty($friend_username)) {
            echo json_encode(["success" => false, "message" => "❌ Friend username is required."]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)");
        $stmt->bind_param("ssss", $username, $friend_username, $friend_username, $username);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "✅ Friend removed successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to remove friend."]);
        }
        $stmt->close();
        break;
    
    default:
        echo json_encode(["success" => false, "message" => "❌ Invalid action."]);
        break;
}
?> 