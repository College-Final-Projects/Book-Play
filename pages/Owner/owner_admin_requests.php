<?php
// Enable error reporting for debugging
ini_set('display_errors', 0); // Disable HTML error output
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

try {
    session_start();
    
    // Debug: Log session info
    error_log("Session user_id: " . ($_SESSION['user_id'] ?? 'null'));
    
    require_once '../../db.php';

    // Check if user is logged in
    $username = $_SESSION['user_id'] ?? '';
    if (!$username) {
        echo json_encode(["success" => false, "message" => "Not logged in"]);
        exit;
    }
    
    // Check if user is an owner (check in owner table)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM owner WHERE owner_email = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->bind_result($isOwner);
    $stmt->fetch();
    $stmt->close();
    
    // Debug: Log owner status
    error_log("User $username is_owner: " . ($isOwner ?? 'null'));
    
    if ($isOwner != 1) {
        echo json_encode(["success" => false, "message" => "Not authorized - Owner access required"]);
        exit;
    }
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    // Debug: Log action
    error_log("Action requested: " . $action);
    
    if ($action === 'list') {
        // Fetch all admin requests
        $result = $conn->query("SELECT r.username, u.email FROM reports r LEFT JOIN users u ON r.username = u.username WHERE r.type = 'admin_request'");
        if (!$result) {
            echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
            exit;
        }
        
        $requests = [];
        while ($row = $result->fetch_assoc()) {
            $requests[] = ["username" => $row['username'], "email" => $row['email'] ?? 'N/A'];
        }
        
        // Debug: Log result
        error_log("Found " . count($requests) . " admin requests");
        
        echo json_encode(["success" => true, "requests" => $requests]);
        exit;
    }
    
    if ($action === 'accept') {
        $target = $_POST['username'] ?? '';
        if (!$target) {
            echo json_encode(["success" => false, "message" => "No username provided"]);
            exit;
        }
        // Set is_admin = 1
        $stmt = $conn->prepare("UPDATE users SET is_admin = 1 WHERE username = ?");
        $stmt->bind_param("s", $target);
        $success = $stmt->execute();
        $stmt->close();
        // Remove the request
        $stmt = $conn->prepare("DELETE FROM reports WHERE username = ? AND type = 'admin_request'");
        $stmt->bind_param("s", $target);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => $success]);
        exit;
    }
    
    if ($action === 'reject') {
        $target = $_POST['username'] ?? '';
        if (!$target) {
            echo json_encode(["success" => false, "message" => "No username provided"]);
            exit;
        }
        // Remove the request
        $stmt = $conn->prepare("DELETE FROM reports WHERE username = ? AND type = 'admin_request'");
        $stmt->bind_param("s", $target);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => $success]);
        exit;
    }
    
    echo json_encode(["success" => false, "message" => "Invalid action"]);
    
} catch (Exception $e) {
    error_log("Exception in owner_admin_requests.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>