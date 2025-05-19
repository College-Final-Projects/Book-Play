<?php
require_once '../../db.php';
header('Content-Type: application/json');

// Process the request based on the action parameter
$action = $_REQUEST['action'] ?? '';

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
    
    $sql = "SELECT * FROM reports WHERE type = 'suggest_place' AND username != ? ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $reports[] = $row;
        }
    }
    
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
    
    if (!$reportId || !$facilitiesId || !in_array($action, ['approve', 'reject'])) {
        echo json_encode(["success" => false, "message" => "❌ Invalid input."]);
        exit;
    }
    
    if ($action === 'approve') {
        // ✅ Update is_Accepted and delete the report
        $update = $conn->prepare("UPDATE sportfacilities SET is_Accepted = 1 WHERE facilities_id = ?");
        $update->bind_param("i", $facilitiesId);
        $update->execute();
        $update->close();
        
        $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
        $deleteReport->bind_param("i", $reportId);
        $deleteReport->execute();
        $deleteReport->close();
        
        echo json_encode(["success" => true, "message" => "✅ Approved successfully."]);
        exit;
    } elseif ($action === 'reject') {
        // ❌ Delete from both tables
        $deleteFacility = $conn->prepare("DELETE FROM sportfacilities WHERE facilities_id = ?");
        $deleteFacility->bind_param("i", $facilitiesId);
        $deleteFacility->execute();
        $deleteFacility->close();
        
        $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
        $deleteReport->bind_param("i", $reportId);
        $deleteReport->execute();
        $deleteReport->close();
        
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

// Close the database connection
$conn->close();
?>