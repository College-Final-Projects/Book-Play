<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Add debugging
error_log("=== REVIEWCOMPLAINTS CONTROLLER DEBUG START ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Session username: " . ($_SESSION['username'] ?? 'null'));
error_log("Action: " . ($_POST['action'] ?? $_GET['action'] ?? 'none'));

// Determine required operation type
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
   case 'get_place_reports':
    $reports = [];
    error_log("Fetching place reports...");
    
    // Get venue reports specifically (type = 'report_place')
    // Exclude reports where the admin is the venue owner to prevent conflicts of interest
    $sql = "SELECT r.*, sf.owner_username 
            FROM reports r
            LEFT JOIN sportfacilities sf ON r.facilities_id = sf.facilities_id
            WHERE r.type = 'report_place' 
            AND (sf.owner_username IS NULL OR sf.owner_username != ?)
            ORDER BY r.created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $_SESSION['username']);
    $stmt->execute();
    $result = $stmt->get_result();

    error_log("Query executed. Found " . $result->num_rows . " reports");

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $reports[] = $row;
            error_log("Report found: ID=" . $row['report_id'] . ", Type=" . $row['type'] . ", Username=" . $row['username'] . ", Venue Owner=" . $row['owner_username']);
        }
    } else {
        error_log("No reports found in database");
    }

    error_log("Returning " . count($reports) . " reports");
    echo json_encode($reports);
    break;
    
    case 'mark_resolved':
        $report_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if ($report_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid report ID']);
            exit;
        }
        
        // Here you would typically update a status field, but since your table 
        // structure doesn't have this field, we'll just delete the report
        $sql = "DELETE FROM reports WHERE report_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $report_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update report']);
        }
        break;
        
    case 'remove_venue':
        $facility_id = isset($_POST['facility_id']) ? intval($_POST['facility_id']) : 0;
        
        if ($facility_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid facility ID']);
            exit;
        }
        
        // In a real implementation, you might want to:
        // 1. Remove related records first (bookings, reports, etc.)
        // 2. Then remove the facility itself
        // 3. Maybe mark as inactive instead of deleting
        
        // Check if a status column exists in the facilities table
        $statusCheck = $conn->query("SHOW COLUMNS FROM facilities LIKE 'status'");
        
        if ($statusCheck && $statusCheck->num_rows > 0) {
            // If status column exists, update it
            $sql = "UPDATE facilities SET status = 'removed' WHERE facilities_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $facility_id);
        } else {
            // If no status column, just delete the facility
            $sql = "DELETE FROM facilities WHERE facilities_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $facility_id);
        }
        
        if ($stmt->execute()) {
            // Now delete related reports
            $sql = "DELETE FROM reports WHERE report_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $report_id);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to remove venue']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

error_log("=== REVIEWCOMPLAINTS CONTROLLER DEBUG END ===");
?>