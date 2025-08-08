<?php
// Enable error reporting for debugging
ini_set('display_errors', 0); // Disable HTML error output
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

try {
    session_start();
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

    if ($isOwner != 1) {
        echo json_encode(["success" => false, "message" => "Not authorized - Owner access required"]);
        exit;
    }

    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    if ($action === 'list') {
        // Fetch all admins
        $result = $conn->query("SELECT username FROM users WHERE is_admin = 1");
        if (!$result) {
            echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
            exit;
        }
        
        $admins = [];
        while ($row = $result->fetch_assoc()) {
            $admins[] = ["username" => $row['username']];
        }
        echo json_encode(["success" => true, "admins" => $admins]);
        exit;
    }

    if ($action === 'get_users') {
        // Fetch all non-admin users for promotion
        $result = $conn->query("SELECT username, email FROM users WHERE is_admin = 0 ORDER BY username");
        if (!$result) {
            echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
            exit;
        }
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = ["username" => $row['username'], "email" => $row['email']];
        }
        echo json_encode(["success" => true, "users" => $users]);
        exit;
    }

    if ($action === 'add') {
        $target = $_POST['username'] ?? '';
        if (!$target) {
            echo json_encode(["success" => false, "message" => "No username provided"]);
            exit;
        }
        
        // Check if user exists and is not already an admin
        $stmt = $conn->prepare("SELECT is_admin FROM users WHERE username = ?");
        $stmt->bind_param("s", $target);
        $stmt->execute();
        $stmt->bind_result($isAdmin);
        $stmt->fetch();
        $stmt->close();
        
        if ($isAdmin === null) {
            echo json_encode(["success" => false, "message" => "User not found"]);
            exit;
        }
        
        if ($isAdmin == 1) {
            echo json_encode(["success" => false, "message" => "User is already an admin"]);
            exit;
        }
        
        // Promote user to admin
        $stmt = $conn->prepare("UPDATE users SET is_admin = 1 WHERE username = ?");
        $stmt->bind_param("s", $target);
        $success = $stmt->execute();
        $stmt->close();
        
        echo json_encode(["success" => $success]);
        exit;
    }

    if ($action === 'remove') {
        $target = $_POST['username'] ?? '';
        if (!$target) {
            echo json_encode(["success" => false, "message" => "No username provided"]);
            exit;
        }
        // Prevent owner from removing themselves
        if ($target === $username) {
            echo json_encode(["success" => false, "message" => "You cannot remove yourself as admin."]);
            exit;
        }
        $stmt = $conn->prepare("UPDATE users SET is_admin = 0 WHERE username = ?");
        $stmt->bind_param("s", $target);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => $success]);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Invalid action"]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>