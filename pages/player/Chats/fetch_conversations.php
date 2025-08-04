<?php
session_start();
require_once '../../db.php'; // غيّر المسار حسب مشروعك

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$currentUser = $_SESSION['user_id'];

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
