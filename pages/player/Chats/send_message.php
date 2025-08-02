<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$sender = $_SESSION['user_id'] ?? '';
$receiver = $_POST['receiver'] ?? '';
$message = trim($_POST['message'] ?? '');

// Add debugging
error_log("Send message - Sender: " . $sender . ", Receiver: " . $receiver . ", Message: " . $message);

if (!$sender || !$receiver || !$message) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $sender, $receiver, $message);

if ($stmt->execute()) {
    error_log("Message sent successfully");
    echo json_encode(["success" => true]);
} else {
    error_log("Database error: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
}
?>