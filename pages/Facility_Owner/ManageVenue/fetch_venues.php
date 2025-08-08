<?php
session_start();
require_once '../../../db.php';
require_once 'upload_images.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get_facilities':
        getFacilities();
        break;

    case 'update_availability':
        updateAvailability();
        break;

    case 'get_sports':
        getSports();
        break;

    case 'add_facility':
        addFacility();
        break;

    case 'update_facility':
    updateFacility();
    break;

    default:
        echo json_encode(["success" => false, "message" => "⛔ Invalid action"]);
        break;
}

function getFacilities() {
    global $conn;

    if (!isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        return;
    }

    $username = $_SESSION['username'];
    $stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE owner_username = ? AND is_Accepted = 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    $facilities = [];
    while ($row = $result->fetch_assoc()) {
        $facilities[] = $row;
    }

    echo json_encode($facilities);
}

function updateAvailability() {
    global $conn;

    if (!isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        return;
    }

    $username = $_SESSION['username'];
    $facility_id = $_POST['facility_id'] ?? null;
    $is_available = $_POST['is_available'] ?? null;

    $check_stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
    $check_stmt->bind_param("is", $facility_id, $username);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
        return;
    }

    $stmt = $conn->prepare("UPDATE sportfacilities SET is_available = ? WHERE facilities_id = ? AND owner_username = ?");
    $stmt->bind_param("iis", $is_available, $facility_id, $username);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Availability updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update"]);
    }
}

function getSports() {
    global $conn;
    $sports = [];
    
    // Get all sports from the sports table that are accepted
    $result = $conn->query("SELECT sport_id, sport_name FROM sports WHERE is_accepted = 1 ORDER BY sport_name ASC");

    while ($row = $result->fetch_assoc()) {
        $sports[] = $row;
    }

    echo json_encode($sports);
}

function addFacility() {
    global $conn;

    if (!isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        return;
    }

    $username = $_SESSION['username'];
    $place_name = $_POST['place_name'] ?? '';
    $sport_type = $_POST['sport_type'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = intval($_POST['price'] ?? 0);
    $location = $_POST['location'] ?? '';
    $latitude = $_POST['latitude'] ?? null;
    $longitude = $_POST['longitude'] ?? null;
    $is_available = isset($_POST['is_available']) ? 1 : 0;
    $image_urls = [];

    // Debug: Log received data
    error_log("Add Facility - Received data: " . json_encode($_POST));
    error_log("Add Facility - Files: " . json_encode($_FILES));

    // Check image upload
    if (isset($_FILES['venueImages']) && 
        is_array($_FILES['venueImages']['name']) && 
        !empty($_FILES['venueImages']['name'][0]) && 
        $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
        
        $image_urls = upload_images($_FILES['venueImages']);
        error_log("Add Facility - Uploaded images: " . json_encode($image_urls));
        
        // Only show error if files were actually selected but failed to upload
        if (empty($image_urls) && $_FILES['venueImages']['error'][0] === UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'Failed to upload images. Please try again.']);
            return;
        }
    }

    // Convert array of image filenames to comma-separated text
    $image_url_string = implode(',', $image_urls);
    error_log("Add Facility - Image URL string: " . $image_url_string);
    
    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("INSERT INTO sportfacilities (place_name, location, description, image_url, owner_username, SportCategory, price, latitude, longitude, is_Accepted, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)");
        $stmt->bind_param("ssssssiddi", $place_name, $location, $description, $image_url_string, $username, $sport_type, $price, $latitude, $longitude, $is_available);

        if (!$stmt->execute()) {
            throw new Exception("Failed to add facility: " . $conn->error);
        }

        $facility_id = $conn->insert_id;

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Facility added successfully", "facility_id" => $facility_id]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function updateFacility() {
    global $conn;

    if (!isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        return;
    }

    $username = $_SESSION['username'];
    $facility_id = $_POST['facility_id'] ?? null;
    $place_name = $_POST['place_name'] ?? '';
    $sport_type = $_POST['sport_type'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = intval($_POST['price'] ?? 0);
    $location = $_POST['location'] ?? '';
    $latitude = $_POST['latitude'] ?? null;
    $longitude = $_POST['longitude'] ?? null;
    $is_available = isset($_POST['is_available']) ? 1 : 0;

    // Debug: Log received data
    error_log("Update Facility - Received data: " . json_encode($_POST));
    error_log("Update Facility - Files: " . json_encode($_FILES));

    // Check if user owns this facility
    $check_stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
    $check_stmt->bind_param("is", $facility_id, $username);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
        return;
    }

    // Handle image upload if new images are provided
    $image_url_string = '';
    $has_new_images = false;
    
    // Check if files were actually uploaded
    if (isset($_FILES['venueImages']) && 
        is_array($_FILES['venueImages']['name']) && 
        !empty($_FILES['venueImages']['name'][0]) && 
        $_FILES['venueImages']['error'][0] !== UPLOAD_ERR_NO_FILE) {
        
        $image_urls = upload_images($_FILES['venueImages']);
        error_log("Update Facility - Uploaded images: " . json_encode($image_urls));
        
        if (!empty($image_urls)) {
            $image_url_string = implode(',', $image_urls);
            $has_new_images = true;
        } else {
            // Only show error if files were actually selected but failed to upload
            if ($_FILES['venueImages']['error'][0] === UPLOAD_ERR_OK) {
                echo json_encode(['success' => false, 'message' => 'Failed to upload images. Please try again.']);
                return;
            }
        }
    }

    // Update query - only update image_url if new images were uploaded
    if ($has_new_images && $image_url_string) {
        $stmt = $conn->prepare("UPDATE sportfacilities SET place_name = ?, location = ?, description = ?, image_url = ?, SportCategory = ?, price = ?, latitude = ?, longitude = ?, is_available = ? WHERE facilities_id = ? AND owner_username = ?");
        $stmt->bind_param("ssssssiddis", $place_name, $location, $description, $image_url_string, $sport_type, $price, $latitude, $longitude, $is_available, $facility_id, $username);
    } else {
        $stmt = $conn->prepare("UPDATE sportfacilities SET place_name = ?, location = ?, description = ?, SportCategory = ?, price = ?, latitude = ?, longitude = ?, is_available = ? WHERE facilities_id = ? AND owner_username = ?");
        $stmt->bind_param("sssssiddis", $place_name, $location, $description, $sport_type, $price, $latitude, $longitude, $is_available, $facility_id, $username);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Facility updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update facility: " . $conn->error]);
    }
}
?>