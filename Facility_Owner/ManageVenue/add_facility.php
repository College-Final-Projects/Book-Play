<?php
session_start();
require_once '../../db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

$username = $_SESSION['user_id'];

// Check if add_facility flag is set
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_facility'])) {
    // Get form data
    $place_name = $_POST['place_name'];
    $sport_type = $_POST['sport_type'];
    $description = $_POST['description'];
    $price = intval($_POST['price']);
    $location = $_POST['location'];
    $is_available = isset($_POST['is_available']) ? 1 : 0;
    
    // Default value for image_url
    $image_url = null;
    
    // Handle image upload if provided
    if (isset($_FILES['venueImages']) && $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
        // Image upload code will go here
        // In a real implementation, you would save the uploaded files to a directory
        // and store the path(s) in $image_url
        // For now, we'll use a placeholder
        $image_url = '/api/placeholder/400/320';
    }
    
    // Insert the new facility into the database
    $insert_stmt = $conn->prepare("
        INSERT INTO sportfacilities 
        (place_name, SportCategory, description, price, location, image_url, owner_username, is_available, is_Accepted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");
    
    $insert_stmt->bind_param(
        "sssissii", 
        $place_name, 
        $sport_type, 
        $description, 
        $price, 
        $location, 
        $image_url, 
        $username, 
        $is_available
    );
    
    $success = $insert_stmt->execute();
    
    if ($success) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Facility added successfully', 
            'facility_id' => $conn->insert_id
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to add facility: ' . $conn->error]);
    }
    
    exit();
} else {
    // Invalid request
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}
?>