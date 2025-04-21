<?php
require_once '../../db.php';
header('Content-Type: application/json');

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
$conn->close();
?>