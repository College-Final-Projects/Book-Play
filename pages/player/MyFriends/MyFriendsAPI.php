<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['user_id'] ?? null;

if (!$username) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// Get current friends
$friendsQuery = "
    SELECT 
        u.username,
        u.first_name,
        u.last_name,
        u.user_image,
        u.sport,
        u.last_active,
        CASE WHEN u.last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END as is_online
    FROM friendships f
    JOIN users u ON (f.user1 = u.username OR f.user2 = u.username)
    WHERE (f.user1 = ? OR f.user2 = ?) 
    AND f.status = 'accepted'
    AND u.username != ?
    ORDER BY u.last_active DESC
";

$stmt = $conn->prepare($friendsQuery);
$stmt->bind_param("sss", $username, $username, $username);
$stmt->execute();
$friendsResult = $stmt->get_result();

$friends = [];
while ($row = $friendsResult->fetch_assoc()) {
    $friends[] = $row;
}

// Get friend requests (incoming)
$requestsQuery = "
    SELECT 
        u.username,
        u.first_name,
        u.last_name,
        u.user_image,
        u.sport,
        u.last_active,
        f.request_date
    FROM friendships f
    JOIN users u ON f.user1 = u.username
    WHERE f.user2 = ? AND f.status = 'pending'
    ORDER BY f.request_date DESC
";

$stmt = $conn->prepare($requestsQuery);
$stmt->bind_param("s", $username);
$stmt->execute();
$requestsResult = $stmt->get_result();

$requests = [];
while ($row = $requestsResult->fetch_assoc()) {
    $requests[] = $row;
}

echo json_encode([
    'success' => true,
    'friends' => $friends,
    'requests' => $requests,
    'stats' => [
        'total_friends' => count($friends),
        'total_requests' => count($requests)
    ]
]);
?> 