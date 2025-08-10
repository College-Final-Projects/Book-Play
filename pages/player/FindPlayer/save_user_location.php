<?php
session_start();
header('Content-Type: application/json');
require_once '../../../db.php';

try {
    // Get current user's username from session
    $currentUsername = $_SESSION['username'] ?? '';
    
    if (empty($currentUsername)) {
        throw new Exception('User not authenticated');
    }
    
    // Get latitude and longitude from POST data
    $latitude = $_POST['latitude'] ?? null;
    $longitude = $_POST['longitude'] ?? null;
    
    if ($latitude === null || $longitude === null) {
        throw new Exception('Latitude and longitude are required');
    }
    
    // Validate coordinates
    if (!is_numeric($latitude) || !is_numeric($longitude)) {
        throw new Exception('Invalid coordinates');
    }
    
    if ($latitude < -90 || $latitude > 90) {
        throw new Exception('Invalid latitude (must be between -90 and 90)');
    }
    
    if ($longitude < -180 || $longitude > 180) {
        throw new Exception('Invalid longitude (must be between -180 and 180)');
    }
    
    // Update user's coordinates in database
    $sql = "UPDATE users SET latitude = ?, longitude = ? WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("dds", $latitude, $longitude, $currentUsername);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Location updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No changes made to location'
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error saving location: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
