<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$currentUser = $_SESSION['username'];

switch ($action) {
    case 'get_conversations':
        getConversations($conn, $currentUser);
        break;
    
    case 'get_messages':
        getMessages($conn, $currentUser);
        break;
    
    case 'send_message':
        sendMessage($conn, $currentUser);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function getConversations($conn, $currentUser) {
    $sql = "SELECT DISTINCT 
               CASE 
                 WHEN sender_username = ? THEN receiver_username 
                 ELSE sender_username 
               END AS chat_partner
            FROM messages
            WHERE sender_username = ? OR receiver_username = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $currentUser, $currentUser, $currentUser);
    $stmt->execute();
    $result = $stmt->get_result();

    $chatUsers = [];
    while ($row = $result->fetch_assoc()) {
        $chatUsers[] = $row['chat_partner'];
    }

    echo json_encode(["success" => true, "users" => $chatUsers]);
}

function getMessages($conn, $currentUser) {
    $chatPartner = $_GET['chat_with'] ?? '';

    if (!$chatPartner) {
        echo json_encode(["success" => false, "message" => "No user selected"]);
        exit;
    }

    $sql = "SELECT sender_username, receiver_username, message_text, message_id 
            FROM messages
            WHERE 
                (sender_username = ? AND receiver_username = ?)
             OR (sender_username = ? AND receiver_username = ?)
            ORDER BY message_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $currentUser, $chatPartner, $chatPartner, $currentUser);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }

    echo json_encode(["success" => true, "messages" => $messages]);
}

function sendMessage($conn, $sender) {
    $receiver = $_POST['receiver'] ?? '';
    $message = trim($_POST['message'] ?? '');

    if (!$sender || !$receiver || !$message) {
        echo json_encode(["success" => false, "message" => "Invalid input"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $sender, $receiver, $message);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
}
?>
