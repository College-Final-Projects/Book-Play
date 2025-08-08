<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

// Add debugging
error_log("SubmitRating.php called");
error_log("Session username: " . ($_SESSION['username'] ?? 'null'));

$input = json_decode(file_get_contents("php://input"), true);
error_log("Input data: " . json_encode($input));

$username = $_SESSION['username'] ?? null;
$facilityId = $input['facility_id'] ?? null;
$rating = $input['rating'] ?? null;
$comment = $input['comment'] ?? null;

if (!$username || !$facilityId || !$rating || $comment === null) {
    error_log("Missing data - username: $username, facilityId: $facilityId, rating: $rating, comment: $comment");
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO ratings (facilities_id, username, rating_value, comment) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isis", $facilityId, $username, $rating, $comment);

if ($stmt->execute()) {
    error_log("Rating submitted successfully");
    echo json_encode(['success' => true, 'message' => 'Rating submitted']);
} else {
    error_log("Failed to submit rating: " . $stmt->error);
    echo json_encode(['success' => false, 'message' => 'Failed to submit rating']);
}
?>