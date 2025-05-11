<?php
// This file is included by ManageVenue.php and should not be accessed directly
if (!defined('INCLUDED')) {
    define('INCLUDED', true);
}

$username = $_SESSION['user_id'];
$message = '';

// Handle facility availability toggle
if (isset($_POST['toggle_availability'])) {
    $facilityId = $_POST['facility_id'] ?? 0;
    $isAvailable = $_POST['is_available'] ?? 0;
    
    // Verify the facility belongs to the user
    $checkStmt = $conn->prepare("SELECT facilities_id FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
    $checkStmt->bind_param("is", $facilityId, $username);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $message = "You don't have permission to modify this facility.";
    } else {
        // Update availability
        $updateStmt = $conn->prepare("UPDATE sportfacilities SET is_available = ? WHERE facilities_id = ?");
        $updateStmt->bind_param("ii", $isAvailable, $facilityId);
        if ($updateStmt->execute()) {
            $message = "Facility availability updated successfully.";
        } else {
            $message = "Error updating facility availability.";
        }
    }
}

// Handle facility deletion
if (isset($_POST['delete_facility'])) {
    $facilityId = $_POST['facility_id'] ?? 0;
    
    // Verify the facility belongs to the user
    $checkStmt = $conn->prepare("SELECT facilities_id FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
    $checkStmt->bind_param("is", $facilityId, $username);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $message = "You don't have permission to delete this facility.";
    } else {
        // Delete facility
        $deleteStmt = $conn->prepare("DELETE FROM sportfacilities WHERE facilities_id = ?");
        $deleteStmt->bind_param("i", $facilityId);
        if ($deleteStmt->execute()) {
            $message = "Facility deleted successfully.";
        } else {
            $message = "Error deleting facility.";
        }
    }
}

// Handle facility addition or update
if (isset($_POST['save_facility'])) {
    $facilityId = $_POST['facility_id'] ?? 0;
    $placeName = $_POST['place_name'] ?? '';
    $sportCategory = $_POST['sport_type'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = $_POST['price'] ?? 0;
    $isAvailable = isset($_POST['is_available']) ? 1 : 0;
    $location = $_POST['location'] ?? '';
    
    if (empty($placeName) || empty($sportCategory) || $price <= 0) {
        $message = "Please fill in all required fields.";
    } else {
        if ($facilityId > 0) {
            // Update existing facility
            $checkStmt = $conn->prepare("SELECT facilities_id FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
            $checkStmt->bind_param("is", $facilityId, $username);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                $message = "You don't have permission to modify this facility.";
            } else {
                $updateStmt = $conn->prepare("UPDATE sportfacilities SET place_name = ?, SportCategory = ?, description = ?, price = ?, is_available = ?, location = ? WHERE facilities_id = ?");
                $updateStmt->bind_param("sssiiis", $placeName, $sportCategory, $description, $price, $isAvailable, $location, $facilityId);
                if ($updateStmt->execute()) {
                    $message = "Facility updated successfully.";
                } else {
                    $message = "Error updating facility.";
                }
            }
        } else {
            // Add new facility
            $insertStmt = $conn->prepare("INSERT INTO sportfacilities (place_name, SportCategory, description, price, is_available, location, owner_username, is_Accepted) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
            $insertStmt->bind_param("sssiiiss", $placeName, $sportCategory, $description, $price, $isAvailable, $location, $username);
            if ($insertStmt->execute()) {
                $message = "Facility added successfully.";
            } else {
                $message = "Error adding facility.";
            }
        }
    }
}

// Fetch facilities for the logged-in user
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE owner_username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$facilities = [];
while ($row = $result->fetch_assoc()) {
    $facilities[] = $row;
}

// Encode for JavaScript
$facilitiesJSON = json_encode($facilities);
$sportsJSON = json_encode($sports);
?>