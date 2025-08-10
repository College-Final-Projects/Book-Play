<?php
// Allow errors to be logged but prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();

// Handle different path contexts (direct access vs included)
$db_path = '../../../db.php';
if (!file_exists($db_path)) {
    $db_path = __DIR__ . '/../../../db.php';
    if (!file_exists($db_path)) {
        $db_path = dirname(dirname(dirname(__DIR__))) . '/db.php';
    }
}
require_once $db_path;

header('Content-Type: application/json');

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$currentUser = $_SESSION['username'] ?? '';
$groupId = $_POST['group_id'] ?? null;
$username = $_POST['username'] ?? null;
$price = $_POST['price'] ?? null;

// Debug logging
error_log("UpdatePlayerPrice - User: $currentUser, Group: $groupId, Target: $username, Price: $price");

// Debug: Check if the user exists in the group before update
$checkStmt = $conn->prepare("SELECT username, required_payment FROM group_members WHERE group_id = ? AND username = ?");
$checkStmt->bind_param("is", $groupId, $username);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
$existingMember = $checkResult->fetch_assoc();
$checkStmt->close();

error_log("UpdatePlayerPrice - Member exists check: " . ($existingMember ? "YES" : "NO"));
if ($existingMember) {
    error_log("UpdatePlayerPrice - Current required_payment: " . $existingMember['required_payment']);
}

if (!$currentUser) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

if (!$groupId || !$username || $price === null) {
    echo json_encode(['success' => false, 'error' => 'Missing required data']);
    exit;
}

// Verify that the current user is the host
$stmt = $conn->prepare("SELECT created_by FROM groups WHERE group_id = ?");
$stmt->bind_param("i", $groupId);
$stmt->execute();
$result = $stmt->get_result();
$group = $result->fetch_assoc();
$stmt->close();

if (!$group || $group['created_by'] !== $currentUser) {
    echo json_encode(['success' => false, 'error' => 'Only the host can update player prices']);
    exit;
}

// Validate price
$price = floatval($price);
if ($price < 0) {
    echo json_encode(['success' => false, 'error' => 'Price cannot be negative']);
    exit;
}

// Update the player's payment amount
$stmt = $conn->prepare("UPDATE group_members SET required_payment = ? WHERE group_id = ? AND username = ?");
$stmt->bind_param("dis", $price, $groupId, $username);
$success = $stmt->execute();
$affectedRows = $stmt->affected_rows;

// Debug the actual query execution
error_log("UpdatePlayerPrice - Query executed: " . ($success ? "SUCCESS" : "FAILED"));
error_log("UpdatePlayerPrice - Affected rows: " . $affectedRows);
if (!$success) {
    error_log("UpdatePlayerPrice - SQL Error: " . $conn->error);
}

$stmt->close();

if ($success) {
    if ($affectedRows > 0) {
        echo json_encode(['success' => true, 'message' => 'Player price updated successfully']);
    } else {
        // More specific error message
        if ($existingMember) {
            // User exists but no rows affected - likely no change in value
            $currentPrice = floatval($existingMember['required_payment']);
            $newPrice = floatval($price);
            if (abs($currentPrice - $newPrice) < 0.01) {
                echo json_encode(['success' => true, 'message' => 'Price unchanged (same value)']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Update failed - no rows affected despite user existing']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Player not found in group']);
        }
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to update price: ' . $conn->error]);
}
?>