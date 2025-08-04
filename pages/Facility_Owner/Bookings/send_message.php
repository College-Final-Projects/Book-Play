<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

$sender = $_SESSION['user_id'] ?? null;
$receiver = $_POST['receiver_username'] ?? '';
$message = trim($_POST['message'] ?? '');

if (!$sender || !$receiver || !$message) {
    echo json_encode(['success' => false, 'message' => 'Missing fields']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $sender, $receiver, $message);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send message.']);
}
?>