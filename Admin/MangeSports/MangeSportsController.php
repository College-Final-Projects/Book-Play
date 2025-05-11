<?php
require_once '../../db.php';
header('Content-Type: application/json');

// تحديد نوع العملية المطلوبة
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // 🟢 إضافة رياضة جديدة مباشرة (تم قبولها مسبقًا)
    case 'add_sport':
        $name = $_POST['name'] ?? '';
        if (!$name) {
            echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO sports (sport_name, is_Accepted) VALUES (?, 1)");
        $stmt->bind_param("s", $name);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "✅ Sport added and pending approval"]);
        } else {
            echo json_encode(["success" => false, "message" => "❌ Failed to add sport"]);
        }
        $stmt->close();
        break;

    // ✅ قبول اقتراح رياضة وإضافتها لجدول الرياضات
    case 'accept':
        $report_id = intval($_POST['report_id'] ?? 0);
        $sport_name = trim($_POST['sport_name'] ?? '');

        if (!$sport_name) {
            echo json_encode(["success" => false, "message" => "❌ Sport name is missing."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO sports (sport_name, is_Accepted) VALUES (?, 1)");
        $stmt->bind_param("s", $sport_name);
        $stmt->execute();
        $stmt->close();

        $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
        $deleteReport->bind_param("i", $report_id);
        $deleteReport->execute();
        $deleteReport->close();

        echo json_encode(["success" => true, "message" => "✅ Sport accepted and added successfully."]);
        break;

    // ❌ رفض اقتراح رياضة (يُحذف التقرير فقط)
    case 'reject':
        $report_id = intval($_POST['report_id'] ?? 0);
        $deleteReport = $conn->prepare("DELETE FROM reports WHERE report_id = ?");
        $deleteReport->bind_param("i", $report_id);
        $deleteReport->execute();
        $deleteReport->close();

        echo json_encode(["success" => true, "message" => "🗑️ Sport suggestion rejected and removed."]);
        break;

    // 📋 جلب الرياضات المقبولة
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

    // 📥 جلب تقارير اقتراحات الرياضات
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
        

    // ⛔ إذا لم يتم التعرف على العملية
    default:
        echo json_encode(["success" => false, "message" => "⛔ Invalid or missing action."]);
        break;
}

$conn->close();
?>
