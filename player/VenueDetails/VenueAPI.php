<?php
// VenueAPI.php - returns facility details + comments
require_once '../../db.php';
header('Content-Type: application/json');

$facilityId = $_GET['facility_id'] ?? null;

if (!$facilityId) {
    echo json_encode(['success' => false, 'message' => 'Facility ID is missing']);
    exit;
}

// Fetch facility details
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ?");
$stmt->bind_param("i", $facilityId);
$stmt->execute();
$result = $stmt->get_result();

if (!$row = $result->fetch_assoc()) {
    echo json_encode(['success' => false, 'message' => 'Facility not found']);
    exit;
}

// Fetch comments for this facility
$commentsStmt = $conn->prepare("SELECT username, rating_value, comment FROM ratings WHERE facilities_id = ?");
$commentsStmt->bind_param("i", $facilityId);
$commentsStmt->execute();
$commentsResult = $commentsStmt->get_result();

$comments = [];
while ($commentRow = $commentsResult->fetch_assoc()) {
    $comments[] = $commentRow;
}

// Calculate average rating
$avgRatingStmt = $conn->prepare("SELECT AVG(rating_value) as avg_rating FROM ratings WHERE facilities_id = ?");
$avgRatingStmt->bind_param("i", $facilityId);
$avgRatingStmt->execute();
$avgRatingResult = $avgRatingStmt->get_result();
$avgRow = $avgRatingResult->fetch_assoc();
$averageRating = round($avgRow['avg_rating'], 1); // e.g., 3.7

// Return combined JSON
echo json_encode([
  'success' => true,
  'facility' => $row,
  'comments' => $comments,
  'average_rating' => $averageRating
]);

?>