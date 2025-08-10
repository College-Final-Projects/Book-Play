<?php
session_start();
require_once '../../../db.php'; // Fixed path to db.php

header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$currentUser = $_SESSION['username'];

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
