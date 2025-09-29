<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

// Debug logging
error_log("ManageVenueAPI.php accessed - Action: " . ($_GET['action'] ?? $_POST['action'] ?? 'none'));
error_log("Session username: " . ($_SESSION['username'] ?? 'not set'));
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Request URI: " . $_SERVER['REQUEST_URI']);

if (!isset($_SESSION['username'])) {
    error_log("User not logged in - returning error");
    echo json_encode(['success' => false, 'message' => 'User not logged in', 'session_data' => $_SESSION]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$username = $_SESSION['username'];

switch ($action) {
    case 'get_facilities':
        getFacilities($conn, $username);
        break;
    
    case 'get_sports':
        getSports($conn);
        break;
    
    case 'add_facility':
        addFacility($conn, $username);
        break;
    
    case 'update_facility':
        updateFacility($conn, $username);
        break;
    
    case 'update_availability':
        updateAvailability($conn, $username);
        break;
    
    case 'suggest_sport':
        suggestSport($conn, $username);
        break;
    
    case 'check_sport':
        checkSport($conn, $username);
        break;
    
    case 'test':
        echo json_encode(['success' => true, 'message' => 'API is working', 'action' => $action]);
        break;
    
    default:
        error_log("Invalid action: " . $action);
        echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action, 'received_action' => $action]);
        break;
}

function getFacilities($conn, $username) {
    error_log("getFacilities function called for user: " . $username);
    $stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE owner_username = ? AND is_Accepted = 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    $facilities = [];
    while ($row = $result->fetch_assoc()) {
        $facilities[] = $row;
    }
    
    error_log("getFacilities returning " . count($facilities) . " facilities");
    echo json_encode($facilities);
}

function getSports($conn) {
    error_log("getSports function called");
    $sports = [];
    
    // Get all sports from the sports table that are accepted
    $result = $conn->query("SELECT sport_id, sport_name FROM sports WHERE is_accepted = 1 ORDER BY sport_name ASC");
    
    if (!$result) {
        error_log("Query failed: " . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database query failed']);
        return;
    }

    while ($row = $result->fetch_assoc()) {
        $sports[] = $row;
    }
    
    error_log("getSports returning " . count($sports) . " sports");
    echo json_encode($sports);
}

function addFacility($conn, $username) {
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

function updateFacility($conn, $username) {
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

function updateAvailability($conn, $username) {
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

function suggestSport($conn, $username) {
    $sport_name = trim($_POST['sport_name'] ?? '');
    $message = trim($_POST['message'] ?? '');
    
    if (empty($sport_name)) {
        echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
        return;
    }
    
    // Check if this sport already exists in the sports table
    $check_existing_sport = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
    $check_existing_sport->bind_param("s", $sport_name);
    $check_existing_sport->execute();
    $existing_result = $check_existing_sport->get_result();
    
    if ($existing_result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "❌ This sport already exists in our database."]);
        $check_existing_sport->close();
        return;
    }
    $check_existing_sport->close();
    
    // Check if this sport suggestion already exists from this user
    $check_stmt = $conn->prepare("SELECT report_id FROM reports WHERE username = ? AND type = 'suggest_sport' AND suggested_sport_name = ?");
    $check_stmt->bind_param("ss", $username, $sport_name);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "❌ You have already suggested this sport."]);
        $check_stmt->close();
        return;
    }
    $check_stmt->close();
    
    // Insert the sport suggestion
    $stmt = $conn->prepare("INSERT INTO reports (username, type, suggested_sport_name, message, created_at) VALUES (?, 'suggest_sport', ?, ?, NOW())");
    $stmt->bind_param("sss", $username, $sport_name, $message);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "✅ Sport suggestion submitted successfully! We'll review it soon."]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Failed to submit sport suggestion. Please try again."]);
    }
    $stmt->close();
}

function checkSport($conn, $username) {
    $sport_name = trim($_GET['sport_name'] ?? '');
    
    if (empty($sport_name)) {
        echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
        return;
    }
    
    // Check if sport already exists in database
    $check_existing = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
    $check_existing->bind_param("s", $sport_name);
    $check_existing->execute();
    $existing_result = $check_existing->get_result();
    $already_exists = $existing_result->num_rows > 0;
    $check_existing->close();
    
    // Check if user has already suggested this sport
    $stmt = $conn->prepare("SELECT report_id FROM reports WHERE username = ? AND type = 'suggest_sport' AND suggested_sport_name = ?");
    $stmt->bind_param("ss", $username, $sport_name);
    $stmt->execute();
    $result = $stmt->get_result();
    $already_suggested = $result->num_rows > 0;
    $stmt->close();
    
    echo json_encode([
        "success" => true, 
        "already_exists" => $already_exists,
        "already_suggested" => $already_suggested
    ]);
}

/**
 * Function to handle multiple image uploads for sport facilities
 * Allows uploading up to 3 images and stores them in the uploads/venues directory
 */
function upload_images($files) {
    // Define the upload directory path (server path)
    $upload_dir = __DIR__ . '/../../../uploads/venues/';

    error_log("Upload Images - Starting upload process");
    error_log("Upload Images - Upload directory: " . $upload_dir);
    error_log("Upload Images - Files received: " . json_encode($files));
    error_log("Upload Images - Directory exists: " . (file_exists($upload_dir) ? 'Yes' : 'No'));
    error_log("Upload Images - Directory writable: " . (is_writable($upload_dir) ? 'Yes' : 'No'));

    // Create the uploads directory if it doesn't exist
    if (!file_exists($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            error_log("Failed to create upload directory: " . $upload_dir);
            return [];
        }
        error_log("Upload Images - Created upload directory: " . $upload_dir);
    }
    
    // Ensure directory is writable (Windows fix)
    if (!is_writable($upload_dir)) {
        chmod($upload_dir, 0777);
        error_log("Upload Images - Set directory permissions to 0777");
    }

    $uploaded_files = [];
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
    $max_size = 5 * 1024 * 1024; // 5MB

    $file_count = min(count($files['name']), 3); // Limit to 3 files
    error_log("Upload Images - Processing $file_count files");

    for ($i = 0; $i < $file_count; $i++) {
        error_log("Upload Images - Processing file $i: " . $files['name'][$i]);
        
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            error_log("File upload error for file $i: " . $files['error'][$i]);
            continue;
        }

        $file_type = $files['type'][$i];
        if (!in_array($file_type, $allowed_types)) {
            error_log("Invalid file type for file $i: " . $file_type);
            continue;
        }

        if ($files['size'][$i] > $max_size) {
            error_log("File too large for file $i: " . $files['size'][$i]);
            continue;
        }

        $new_filename = uniqid() . '_' . basename($files['name'][$i]);
        $destination = $upload_dir . $new_filename;
        
        error_log("Upload Images - Moving file to: " . $destination);
        error_log("Upload Images - Source temp file: " . $files['tmp_name'][$i]);
        error_log("Upload Images - Source temp file exists: " . (file_exists($files['tmp_name'][$i]) ? 'Yes' : 'No'));
        error_log("Upload Images - Destination directory writable: " . (is_writable(dirname($destination)) ? 'Yes' : 'No'));

        if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
            // Store only the filename for database storage
            $uploaded_files[] = $new_filename;
            error_log("Upload Images - Successfully uploaded: " . $new_filename);
            error_log("Upload Images - Final file exists at destination: " . (file_exists($destination) ? 'Yes' : 'No'));
        } else {
            error_log("Failed to move uploaded file: " . $files['tmp_name'][$i] . " to " . $destination);
            error_log("Upload Images - Last PHP error: " . error_get_last()['message']);
        }
    }

    error_log("Upload Images - Final result: " . json_encode($uploaded_files));
    return $uploaded_files;
}
?>
