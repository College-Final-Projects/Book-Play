<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['username'] ?? null;
$facility_id = $_POST['facility_id'] ?? null;

if (!$username || !$facility_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user or facility ID']);
    exit;
}

// Check if already exists
$stmt = $conn->prepare("SELECT * FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
$stmt->bind_param("si", $username, $facility_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Remove favorite
    $delete = $conn->prepare("DELETE FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
    $delete->bind_param("si", $username, $facility_id);
    $delete->execute();
    echo json_encode(['success' => true, 'favorited' => false]);
} else {
    // Add favorite
    $insert = $conn->prepare("INSERT INTO user_favorite_facilities (user_id, facility_id) VALUES (?, ?)");
    $insert->bind_param("si", $username, $facility_id);
    $insert->execute();
    echo json_encode(['success' => true, 'favorited' => true]);
}
?>
