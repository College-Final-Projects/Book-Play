<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);

$username = $_SESSION['user_id'] ?? null;
$facilityId = $input['facility_id'] ?? null;
$reason = $input['reason'] ?? null;
$details = $input['details'] ?? null;

if (!$username || !$facilityId || !$reason) {
    echo json_encode(['success' => false, 'message' => 'Missing required data']);
    exit;
}

// Check if user already reported this venue
$checkStmt = $conn->prepare("SELECT id FROM venue_reports WHERE facilities_id = ? AND username = ?");
$checkStmt->bind_param("is", $facilityId, $username);
$checkStmt->execute();
$existingReport = $checkStmt->get_result()->fetch_assoc();

if ($existingReport) {
    echo json_encode(['success' => false, 'message' => 'You have already reported this venue']);
    exit;
}

// Insert the report
$stmt = $conn->prepare("INSERT INTO venue_reports (facilities_id, username, reason, details, report_date) VALUES (?, ?, ?, ?, NOW())");
$stmt->bind_param("isss", $facilityId, $username, $reason, $details);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Report submitted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to submit report']);
}
?> 