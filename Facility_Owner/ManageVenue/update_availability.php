<?php
session_start();
require_once '../../db.php';
require_once 'upload_images.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

$username = $_SESSION['user_id'];

// Check if toggle_availability flag is set (for availability toggle)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_availability'])) {
    // Get form data
    $facility_id = intval($_POST['facility_id']);
    $is_available = intval($_POST['is_available']);
    
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
    
    // Update only the availability status in the database
    $update_stmt = $conn->prepare("
        UPDATE sportfacilities 
        SET is_available = ?
        WHERE facilities_id = ? AND owner_username = ?
    ");
    
    $update_stmt->bind_param(
        "iis", 
        $is_available,
        $facility_id, 
        $username
    );
    
    $success = $update_stmt->execute();
    
    if ($success) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Availability updated successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Failed to update availability: ' . $conn->error]);
    }
    
    exit();
}
// Check if edit_facility flag is set (for editing facility)
else if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_facility'])) {
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
    
    // Start a transaction to ensure data integrity
    $conn->begin_transaction();
    
    try {
        // Get the current image URL from the database
        $get_image_stmt = $conn->prepare("SELECT image_url FROM sportfacilities WHERE facilities_id = ?");
        $get_image_stmt->bind_param("i", $facility_id);
        $get_image_stmt->execute();
        $image_result = $get_image_stmt->get_result();
        $current_image_url = '';
        
        if ($image_row = $image_result->fetch_assoc()) {
            $current_image_url = $image_row['image_url'];
        }
        
        // Handle image upload if provided
        $image_url_string = $current_image_url; // Default to current images
        
        if (isset($_FILES['venueImages']) && $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
            // Process the uploaded images using our custom function
            $image_urls = upload_images($_FILES['venueImages']);
            
            // If we got new images, convert the array to a comma-separated string
            if (!empty($image_urls)) {
                $image_url_string = implode(',', $image_urls);
            }
        }
        
        // Update the facility in the database, including the image URL
        $update_stmt = $conn->prepare("
            UPDATE sportfacilities 
            SET place_name = ?, 
                SportCategory = ?, 
                description = ?, 
                price = ?, 
                location = ?, 
                is_available = ?,
                image_url = ?
            WHERE facilities_id = ? AND owner_username = ?
        ");
        
        $update_stmt->bind_param(
            "sssisssis", 
            $place_name, 
            $sport_type, 
            $description, 
            $price, 
            $location, 
            $is_available,
            $image_url_string,
            $facility_id, 
            $username
        );
        
        $success = $update_stmt->execute();
        
        if (!$success) {
            throw new Exception("Failed to update facility: " . $conn->error);
        }
        
        // Commit the transaction
        $conn->commit();
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Facility updated successfully',
            'image_url' => $image_url_string
        ]);
    } catch (Exception $e) {
        // Roll back the transaction in case of error
        $conn->rollback();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    exit();
} else {
    // Invalid request
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}
?>