<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Add debugging
error_log("=== VENUEAPI.PHP DEBUG START ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Session user_id: " . ($_SESSION['user_id'] ?? 'null'));

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
    case 'update_status':
        updateReportStatus();
        break;
    default:
        echo json_encode(["success" => false, "message" => "⛔ Invalid action specified."]);
        break;
}

// Function to get all reports
function getReports() {
    global $conn;
    
    error_log("=== GETREPORTS DEBUG START ===");
    error_log("Session user_id: " . ($_SESSION['user_id'] ?? 'null'));
    
    // Get both venue suggestions (reports) and unaccepted venues
    // For venue suggestions: exclude suggestions submitted by the current admin
    // For unaccepted venues: exclude venues owned by the current admin
    $sql = "SELECT 
                'report' as source_type,
                r.report_id,
                r.username,
                r.suggested_place_name as place_name,
                r.facilities_id,
                r.created_at,
                r.message,
                sf.location,
                sf.price,
                sf.image_url
            FROM reports r
            LEFT JOIN sportfacilities sf ON r.facilities_id = sf.facilities_id
            WHERE r.type = 'suggest_place'
            AND r.username != ?
            
            UNION ALL
            
            SELECT 
                'venue' as source_type,
                NULL as report_id,
                sf.owner_username as username,
                sf.place_name,
                sf.facilities_id,
                NOW() as created_at,
                CONCAT('Sport: ', sf.SportCategory, ' | Price: ', sf.price, ' | Location: ', sf.location) as message,
                sf.location,
                sf.price,
                sf.image_url
            FROM sportfacilities sf
            WHERE sf.is_Accepted = 0
            AND sf.owner_username != ?
            
            ORDER BY created_at DESC";
    
    error_log("SQL Query: " . $sql);
    error_log("Filtering out suggestions by: " . $_SESSION['user_id']);
    error_log("Filtering out venues owned by: " . $_SESSION['user_id']);
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $_SESSION['user_id'], $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result) {
        error_log("❌ SQL Error: " . $conn->error);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        return;
    }
    
    error_log("Query executed. Found " . ($result ? $result->num_rows : 0) . " items");
    
    $reports = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $reports[] = $row;
            error_log("Item found: " . $row['source_type'] . " - " . $row['place_name'] . " (Owner: " . $row['username'] . ")");
        }
    } else {
        error_log("No venue requests or unaccepted venues found");
    }
    
    error_log("Returning " . count($reports) . " items");
    error_log("=== GETREPORTS DEBUG END ===");
    echo json_encode($reports);
}

// Function to handle approve/reject actions
function handleAction() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "⛔ Only POST method allowed."]);
        exit;
    }
    
    $action = $_POST['subaction'] ?? '';
    $reportId = $_POST['report_id'] ?? null;
    $facilitiesId = $_POST['facilities_id'] ?? null;
    
    error_log("Handle action: $action, reportId: $reportId, facilitiesId: $facilitiesId");
    
    if (!$facilitiesId || !in_array($action, ['approve', 'reject'])) {
        echo json_encode(["success" => false, "message" => "❌ Invalid input."]);
        exit;
    }
    
    if ($action === 'approve') {
        // ✅ Update is_Accepted to 1
        $update = $conn->prepare("UPDATE sportfacilities SET is_Accepted = 1 WHERE facilities_id = ?");
        $update->bind_param("i", $facilitiesId);
        $update->execute();
        $update->close();
        
        // If there's a report_id, delete the report
        if ($reportId) {
            $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
            $deleteReport->bind_param("i", $reportId);
            $deleteReport->execute();
            $deleteReport->close();
        }
        
        echo json_encode(["success" => true, "message" => "✅ Approved successfully."]);
        exit;
    } elseif ($action === 'reject') {
        // ❌ Delete from sportfacilities table
        $deleteFacility = $conn->prepare("DELETE FROM sportfacilities WHERE facilities_id = ?");
        $deleteFacility->bind_param("i", $facilitiesId);
        $deleteFacility->execute();
        $deleteFacility->close();
        
        // If there's a report_id, delete the report too
        if ($reportId) {
            $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
            $deleteReport->bind_param("i", $reportId);
            $deleteReport->execute();
            $deleteReport->close();
        }
        
        echo json_encode(["success" => true, "message" => "❌ Rejected and deleted."]);
        exit;
    }
}

// Function to update report status
function updateReportStatus() {
    global $conn;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "⛔ Only POST method allowed."]);
        exit;
    }
    
    $report_id = $_POST['report_id'] ?? null;
    $status = $_POST['status'] ?? null;
    
    if (!$report_id || !in_array($status, ['accepted', 'rejected'])) {
        echo json_encode(["success" => false, "message" => "❌ Invalid input."]);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE reports SET status = ? WHERE report_id = ?");
    $stmt->bind_param("si", $status, $report_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "✅ Report updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Failed to update report."]);
    }
    
    $stmt->close();
}

error_log("=== VENUEAPI.PHP DEBUG END ===");
?>