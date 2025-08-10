<?php
session_start();
require_once '../../../db.php'; // adjust according to your project

header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$currentUser = $_SESSION['username'];
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
?>