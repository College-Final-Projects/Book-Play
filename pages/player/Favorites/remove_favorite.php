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

try {
    // Remove from favorites
    $stmt = $conn->prepare("DELETE FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
    $stmt->bind_param("si", $username, $facility_id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Removed from favorites']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Facility not found in favorites']);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error removing from favorites: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
