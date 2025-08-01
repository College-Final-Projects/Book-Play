<?php
session_start();
require_once '../../db.php';

header('Content-Type: application/json');

$sender = $_SESSION['user_id'] ?? '';
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
?>