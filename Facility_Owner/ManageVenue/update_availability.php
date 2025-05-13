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

// Check if edit_facility flag is set
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_facility'])) {
    // Get form data
    $facility_id = intval($_POST['facility_id']);
    $place_name = $_POST['place_name'];
    $sport_type = $_POST['sport_type'];
    $description = $_POST['description'];
    $price = intval($_POST['price']);
    $location = $_POST['location'];
    $is_available = isset($_POST['is_available']) ? 1 : 0;
    
    // Verify that this facility belongs to the current user
    $check_stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
    $check_stmt->bind_param("is", $facility_id, $username);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows === 0) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'You do not have permission to edit this facility']);
        exit();
    }
    
    // Handle image upload if provided
    $image_url = null;
    if (isset($_FILES['venueImages']) && $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
        // Image upload code will go here
        // For now, we'll just keep the existing image URL
        $get_image_stmt = $conn->prepare("SELECT image_url FROM sportfacilities WHERE facilities_id = ?");
        $get_image_stmt->bind_param("i", $facility_id);
        $get_image_stmt->execute();
        $image_result = $get_image_stmt->get_result();
        
        if ($image_row = $image_result->fetch_assoc()) {
            $image_url = $image_row['image_url'];
        }
    } else {
        // Keep existing image URL
        $get_image_stmt = $conn->prepare("SELECT image_url FROM sportfacilities WHERE facilities_id = ?");
        $get_image_stmt->bind_param("i", $facility_id);
        $get_image_stmt->execute();
        $image_result = $get_image_stmt->get_result();
        
        if ($image_row = $image_result->fetch_assoc()) {
            $image_url = $image_row['image_url'];
        }
    }
    
    // Update the facility in the database
    $update_stmt = $conn->prepare("
        UPDATE sportfacilities 
        SET place_name = ?, 
            SportCategory = ?, 
            description = ?, 
            price = ?, 
            location = ?, 
            is_available = ?
        WHERE facilities_id = ? AND owner_username = ?
    ");
    
    $update_stmt->bind_param(
        "sssissis", 
        $place_name, 
        $sport_type, 
        $description, 
        $price, 
        $location, 
        $is_available, 
        $facility_id, 
        $username
    );
    
    $success = $update_stmt->execute();
    
    if ($success) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Facility updated successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to update facility: ' . $conn->error]);
    }
    
    exit();
} else {
    // Invalid request
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}
?>