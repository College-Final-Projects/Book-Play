<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Add debugging
error_log("=== SUBMITREPORT.PHP DEBUG START ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Session username: " . ($_SESSION['username'] ?? 'null'));

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    error_log("❌ User not logged in");
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("❌ Not a POST request");
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

// Get the JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    error_log("❌ Invalid JSON input");
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Extract data
$facility_id = $input['facility_id'] ?? null;
$reason = $input['reason'] ?? '';
$details = $input['details'] ?? '';
$username = $_SESSION['username'];

error_log("Received data - facility_id: $facility_id, reason: $reason, details: $details, username: $username");

// Validate required fields
if (!$facility_id || !$reason) {
    error_log("❌ Missing required fields");
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Validate facility exists
$check_stmt = $conn->prepare("SELECT facilities_id FROM sportfacilities WHERE facilities_id = ?");
$check_stmt->bind_param("i", $facility_id);
$check_stmt->execute();
$result = $check_stmt->get_result();

if ($result->num_rows === 0) {
    error_log("❌ Venue not found for ID: $facility_id");
    echo json_encode(['success' => false, 'message' => 'Venue not found']);
    exit;
}

error_log("✅ Venue found, proceeding with report insertion");

// Insert the report into database
$stmt = $conn->prepare("INSERT INTO reports (username, type, facilities_id, Reason, message, created_at) VALUES (?, 'report_place', ?, ?, ?, NOW())");
$stmt->bind_param("siss", $username, $facility_id, $reason, $details);

if ($stmt->execute()) {
    error_log("✅ Report submitted successfully");
    echo json_encode(['success' => true, 'message' => 'Report submitted successfully']);
} else {
    error_log("❌ Failed to submit report: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Failed to submit report: ' . $conn->error]);
}

$stmt->close();
error_log("=== SUBMITREPORT.PHP DEBUG END ===");
?> 