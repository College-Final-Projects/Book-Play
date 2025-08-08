<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Add debugging
error_log("=== VENUEAPI.PHP DEBUG START ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Session username: " . ($_SESSION['username'] ?? 'null'));

// Process the request based on the action parameter
$action = $_REQUEST['action'] ?? '';
error_log("Action requested: " . $action);

switch ($action) {
    case 'get_reports':
        getReports();
        break;
    case 'handle_action':
        handleAction();
        break;
    default:
        echo json_encode(["success" => false, "message" => "⛔ Invalid action specified."]);
        break;
}

// Function to get all unaccepted facilities
function getReports() {
    global $conn;
    
    error_log("=== GETREPORTS DEBUG START ===");
    error_log("Session username: " . ($_SESSION['username'] ?? 'null'));
    
    // Get only unaccepted venues from sportfacilities table
    // Exclude venues owned by the current admin
    $sql = "SELECT 
                'venue' as source_type,
                sf.owner_username as username,
                sf.place_name,
                sf.facilities_id,
                NOW() as created_at,
                CONCAT('Sport: ', sf.SportCategory, ' | Price: ', sf.price, ' | Location: ', sf.location) as message,
                sf.location,
                sf.price,
                sf.image_url,
                sf.SportCategory,
                sf.description
            FROM sportfacilities sf
            WHERE sf.is_Accepted = 0
            AND sf.owner_username != ?
            ORDER BY sf.facilities_id DESC";
    
    error_log("SQL Query: " . $sql);
    error_log("Filtering out venues owned by: " . $_SESSION['username']);
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $_SESSION['username']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result) {
        error_log("❌ SQL Error: " . $conn->error);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        return;
    }
    
    error_log("Query executed. Found " . ($result ? $result->num_rows : 0) . " items");
    
    $facilities = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $facilities[] = $row;
            error_log("Facility found: " . $row['place_name'] . " (Owner: " . $row['username'] . ")");
        }
    } else {
        error_log("No unaccepted facilities found");
    }
    
    error_log("Returning " . count($facilities) . " items");
    error_log("=== GETREPORTS DEBUG END ===");
    echo json_encode($facilities);
}

// Function to handle approve/reject actions
function handleAction() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "⛔ Only POST method allowed."]);
        exit;
    }
    
    $action = $_POST['subaction'] ?? '';
    $facilitiesId = $_POST['facilities_id'] ?? null;
    
    error_log("Handle action: $action, facilitiesId: $facilitiesId");
    
    if (!$facilitiesId || !in_array($action, ['approve', 'reject'])) {
        echo json_encode(["success" => false, "message" => "❌ Invalid input."]);
        exit;
    }
    
    if ($action === 'approve') {
        // ✅ Update is_Accepted to 1
        $update = $conn->prepare("UPDATE sportfacilities SET is_Accepted = 1 WHERE facilities_id = ?");
        $update->bind_param("i", $facilitiesId);
        
        if ($update->execute()) {
            echo json_encode(["success" => true, "message" => "✅ Facility approved successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to approve facility."]);
        }
        $update->close();
        exit;
    } elseif ($action === 'reject') {
        // ❌ Delete from sportfacilities table
        $deleteFacility = $conn->prepare("DELETE FROM sportfacilities WHERE facilities_id = ?");
        $deleteFacility->bind_param("i", $facilitiesId);
        
        if ($deleteFacility->execute()) {
            echo json_encode(["success" => true, "message" => "❌ Facility rejected and deleted."]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to reject facility."]);
        }
        $deleteFacility->close();
        exit;
    }
}

error_log("=== VENUEAPI.PHP DEBUG END ===");
?>