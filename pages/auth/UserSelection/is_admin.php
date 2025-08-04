<?php
// check-admin-status.php - Returns user's admin status as JSON

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
include '../../../db.php';

// Default response
$response = ['is_admin' => 0];

// Check if user is logged in
if (isset($_SESSION['username'])) {
    $userId = $_SESSION['username'];

    // Prepare SQL to get is_admin status
    $stmt = $conn->prepare("SELECT is_admin FROM users WHERE username = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $response['is_admin'] = (int)$row['is_admin'];
    }
    
    $stmt->close();
} 

// Set header to JSON content type
header('Content-Type: application/json');

// Return JSON response
echo json_encode($response);
?>