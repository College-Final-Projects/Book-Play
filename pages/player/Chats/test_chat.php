<?php
session_start();
require_once '../../../db.php';

// Add some test messages if they don't exist
$testUsers = ['user1', 'user2', 'user3'];

// Check if we have a logged-in user
if (!isset($_SESSION['user_id'])) {
    echo "Please log in first";
    exit;
}

$currentUser = $_SESSION['user_id'];
echo "Current user: " . $currentUser . "<br>";

// Add some test messages
$testMessages = [
    ['sender' => $currentUser, 'receiver' => 'user1', 'message' => 'Hello user1!'],
    ['sender' => 'user1', 'receiver' => $currentUser, 'message' => 'Hi there!'],
    ['sender' => $currentUser, 'receiver' => 'user2', 'message' => 'How are you user2?'],
    ['sender' => 'user2', 'receiver' => $currentUser, 'message' => 'I\'m good, thanks!'],
];

foreach ($testMessages as $msg) {
    $stmt = $conn->prepare("INSERT IGNORE INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $msg['sender'], $msg['receiver'], $msg['message']);
    $stmt->execute();
}

echo "Test messages added!<br>";
echo "<a href='Chats.php'>Go to Chat</a>";
?> 