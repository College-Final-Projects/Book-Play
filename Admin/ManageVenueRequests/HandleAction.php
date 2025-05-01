<?php
require_once '../../db.php';
header('Content-Type: application/json');

// التحقق من نوع الطلب
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $reportId = $_POST['report_id'] ?? null;
    $facilitiesId = $_POST['facilities_id'] ?? null;

    if (!$reportId || !$facilitiesId || !in_array($action, ['approve', 'reject'])) {
        echo json_encode(["success" => false, "message" => "❌ Invalid input."]);
        exit;
    }

    if ($action === 'approve') {
        // ✅ تحديث is_Accepted وحذف التقرير
        $update = $conn->prepare("UPDATE sportfacilities SET is_Accepted = 1, is_available = 1 WHERE facilities_id = ?");
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
        // ❌ حذف من الجدولين
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

// غير ذلك
echo json_encode(["success" => false, "message" => "⛔ Invalid request."]);
exit();
?>