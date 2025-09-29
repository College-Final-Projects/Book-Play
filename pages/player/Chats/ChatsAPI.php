<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$currentUser = $_SESSION['username'];

if ($method === 'GET' && $action === 'list_conversations') {
    $sql = "SELECT DISTINCT 
               CASE 
                 WHEN sender_username = ? THEN receiver_username 
                 ELSE sender_username 
               END AS chat_partner,
               (SELECT message_text FROM messages 
                WHERE (sender_username = ? AND receiver_username = chat_partner) 
                   OR (sender_username = chat_partner AND receiver_username = ?)
                ORDER BY message_id DESC LIMIT 1) as last_message,
               (SELECT message_id FROM messages 
                WHERE (sender_username = ? AND receiver_username = chat_partner) 
                   OR (sender_username = chat_partner AND receiver_username = ?)
                ORDER BY message_id DESC LIMIT 1) as last_message_id
            FROM messages
            WHERE sender_username = ? OR receiver_username = ?
            ORDER BY last_message_id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssss", $currentUser, $currentUser, $currentUser, $currentUser, $currentUser, $currentUser, $currentUser);
    $stmt->execute();
    $result = $stmt->get_result();

    $chatUsers = [];
    while ($row = $result->fetch_assoc()) {
        $chatUsers[] = [
            'username' => $row['chat_partner'],
            'last_message' => $row['last_message'] ?? 'No messages yet',
            'last_message_id' => $row['last_message_id']
        ];
    }

    echo json_encode(["success" => true, "users" => $chatUsers]);
    exit;
}

if ($method === 'GET' && $action === 'list_messages') {
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
    exit;
}

if ($method === 'POST' && $action === 'send_message') {
    $receiver = $_POST['receiver'] ?? '';
    $message = trim($_POST['message'] ?? '');

    if (!$receiver || !$message) {
        echo json_encode(["success" => false, "message" => "Invalid input"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $currentUser, $receiver, $message);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid action"]);
?>

