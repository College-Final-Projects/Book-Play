<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$currentUser = $_SESSION['user_id'];

// Add debugging
error_log("Current user: " . $currentUser);

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

// Add debugging
error_log("Found chat users: " . json_encode($chatUsers));

echo json_encode(["success" => true, "users" => $chatUsers]);
?>
