<?php
session_start();
require_once '../../db.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);

$username = $_SESSION['user_id'] ?? null;
$facilityId = $input['facility_id'] ?? null;
$rating = $input['rating'] ?? null;
$comment = $input['comment'] ?? null;

if (!$username || !$facilityId || !$rating || $comment === null) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO ratings (facilities_id, username, rating_value, comment) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isis", $facilityId, $username, $rating, $comment);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Rating submitted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to submit rating']);
}
?>