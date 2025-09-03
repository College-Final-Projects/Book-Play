<?php
require_once '../../../db.php';
header('Content-Type: application/json');

// Determine requested action
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // 🟢 Add new sport directly (already accepted)
    case 'add_sport':
        $name = trim($_POST['name'] ?? '');
        if (!$name) {
            echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
            exit;
        }

        // Check if sport already exists
        $checkStmt = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
        $checkStmt->bind_param("s", $name);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            $checkStmt->close();
            echo json_encode(["success" => false, "message" => "ℹ️ Sport '$name' already exists in the system."]);
        } else {
            $checkStmt->close();
            
            $stmt = $conn->prepare("INSERT INTO sports (sport_name, is_Accepted) VALUES (?, 1)");
            $stmt->bind_param("s", $name);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "✅ Sport '$name' added successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "❌ Failed to add sport '$name'. Please try again."]);
            }
            $stmt->close();
        }
        break;

    // ✅ Accept suggested sport and add to sports table
    case 'accept':
        $report_id = intval($_POST['report_id'] ?? 0);
        $sport_name = trim($_POST['sport_name'] ?? '');

        if (!$sport_name) {
            echo json_encode(["success" => false, "message" => "❌ Sport name is missing."]);
            exit;
        }

        // Check if sport already exists
        $checkStmt = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
        $checkStmt->bind_param("s", $sport_name);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            // Sport already exists, just delete the report and show message
            $checkStmt->close();
            
            $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
            $deleteReport->bind_param("i", $report_id);
            $deleteReport->execute();
            $deleteReport->close();

            echo json_encode(["success" => true, "message" => "ℹ️ Sport '$sport_name' already exists in the system. Suggestion removed."]);
        } else {
            // Sport doesn't exist, add it and delete report
            $checkStmt->close();
            
            $stmt = $conn->prepare("INSERT INTO sports (sport_name, is_Accepted) VALUES (?, 1)");
            $stmt->bind_param("s", $sport_name);
            
            if ($stmt->execute()) {
                $stmt->close();
                
                $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
                $deleteReport->bind_param("i", $report_id);
                $deleteReport->execute();
                $deleteReport->close();

                echo json_encode(["success" => true, "message" => "✅ Sport '$sport_name' accepted and added successfully."]);
            } else {
                $stmt->close();
                echo json_encode(["success" => false, "message" => "❌ Failed to add sport '$sport_name'. Please try again."]);
            }
        }
        break;

    // ❌ Reject suggested sport (only delete report)
    case 'reject':
        $report_id = intval($_POST['report_id'] ?? 0);
        $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
        $deleteReport->bind_param("i", $report_id);
        $deleteReport->execute();
        $deleteReport->close();

        echo json_encode(["success" => true, "message" => "🗑️ Sport suggestion rejected and removed."]);
        break;

    // 📋 Fetch accepted sports
    case 'get_accepted_sports':
        $sports = [];
        $sql = "SELECT * FROM sports WHERE is_Accepted = 1";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $sports[] = $row;
            }
        }

        echo json_encode($sports);
        break;

    // 📥 Fetch sport suggestion reports
    case 'get_suggested_sports':
        $reports = [];
        $sql = "SELECT * FROM reports WHERE type = 'suggest_sport' ORDER BY created_at DESC";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $reports[] = $row;
            }
        }

        echo json_encode($reports);
        break;

    // 🗑️ Delete a sport
    case 'delete_sport':
        $sport_id = intval($_POST['sport_id'] ?? 0);
        if ($sport_id <= 0) {
            echo json_encode(["success" => false, "message" => "❌ Invalid sport ID."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM sports WHERE sport_id = ?");
        $stmt->bind_param("i", $sport_id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "🗑️ Sport deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to delete sport."]);
        }
        $stmt->close();
        break;

    // ⛔ Unrecognized or missing action
    default:
        echo json_encode(["success" => false, "message" => "⛔ Invalid or missing action."]);
        break;
}

$conn->close();
?>
