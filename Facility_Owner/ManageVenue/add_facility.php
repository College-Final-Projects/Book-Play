<?php
// Start or resume the session to maintain user login state
session_start();

// Include the database connection file
require_once '../../db.php';

// Include our custom image upload function
require_once 'upload_images.php';

// Check if the user is logged in by verifying if user_id exists in session
if (!isset($_SESSION['user_id'])) {
    // Set the response content type to JSON
    header('Content-Type: application/json');
    
    // Return error message as JSON
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    
    // Stop script execution
    exit();
}

// Get the username from the session
$username = $_SESSION['user_id'];

// Check if this is a POST request and if the add_facility flag is set
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_facility'])) {
    // Get the place name from the form data
    $place_name = $_POST['place_name'];
    
    // Get the sport type from the form data
    $sport_type = $_POST['sport_type'];
    
    // Get the description from the form data
    $description = $_POST['description'];
    
    // Get the price and convert it to an integer
    $price = intval($_POST['price']);
    
    // Get the location from the form data
    $location = $_POST['location'];
    
    // Check if the is_available checkbox was checked
    $is_available = isset($_POST['is_available']) ? 1 : 0;
    
    // Initialize an empty array for image URLs
    $image_urls = [];
    
    // Check if image files were uploaded
    if (isset($_FILES['venueImages']) && $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
        // Process the uploaded images using our custom function
        $image_urls = upload_images($_FILES['venueImages']);
    }
    
    // Convert the array of image paths to a comma-separated string
    $image_url_string = implode(',', $image_urls);
    
    // Start a database transaction to ensure data integrity
    $conn->begin_transaction();
    
    try {
        // 1. First insert into sportfacilities table with is_Accepted = 0
        $facility_stmt = $conn->prepare("
            INSERT INTO sportfacilities 
            (place_name, location, description, image_url, owner_username, SportCategory, price, is_Accepted, is_available) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        ");
        
        $facility_stmt->bind_param(
            "ssssssii",
            $place_name,        // Place name
            $location,          // Location
            $description,       // Description
            $image_url_string,  // Image URLs
            $username,          // Owner username
            $sport_type,        // Sport category
            $price,             // Price
            $is_available       // Availability
        );
        
        // Execute the prepared statement
        $facility_success = $facility_stmt->execute();
        
        // Check if the insertion was successful
        if (!$facility_success) {
            // If not successful, throw an exception with error details
            throw new Exception("Failed to add new facility: " . $conn->error);
        }
        
        // Get the ID of the newly inserted facility
        $facility_id = $conn->insert_id;
        
        // 2. Also insert into reports table to notify admin
        $report_stmt = $conn->prepare("
            INSERT INTO reports 
            (username, type, suggested_place_name, facilities_id, message, created_at) 
            VALUES (?, 'suggest_place', ?, ?, ?, NOW())
        ");
        
        // Create a detailed message containing all the facility information
        $report_message = "Sport type: $sport_type\nLocation: $location\nPrice: $price\nDescription: $description\nImages: $image_url_string";
        
        // Bind parameters to the prepared statement
        $report_stmt->bind_param(
            "ssis", 
            $username,          // Username of the current user  
            $place_name,        // Name of the suggested place
            $facility_id,       // ID of the new facility
            $report_message     // Detailed information about the facility
        );
        
        // Execute the prepared statement
        $report_success = $report_stmt->execute();
        
        // Check if the insertion was successful
        if (!$report_success) {
            // If not successful, throw an exception with error details
            throw new Exception("Failed to submit facility suggestion: " . $conn->error);
        }
        
        // Get the ID of the newly inserted report
        $report_id = $conn->insert_id;
        
        // Commit the transaction to save changes to the database
        $conn->commit();
        
        // Set the response content type to JSON
        header('Content-Type: application/json');
        
        // Return success message and report ID as JSON
        echo json_encode([
            'success' => true, 
            'message' => 'Facility suggestion submitted successfully. An admin will review it shortly.', 
            'report_id' => $report_id,
            'facility_id' => $facility_id
        ]);
    } catch (Exception $e) {
        // If an error occurred, rollback the transaction
        $conn->rollback();
        
        // Set the response content type to JSON
        header('Content-Type: application/json');
        
        // Return error message as JSON
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    // Stop script execution
    exit();
} else {
    // If request method is not POST or add_facility is not set
    // Set the response content type to JSON
    header('Content-Type: application/json');
    
    // Return error message as JSON
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    
    // Stop script execution
    exit();
}
?>