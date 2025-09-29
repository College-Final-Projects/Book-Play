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
    $username = $_SESSION['username'] ?? '';
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

    switch ($action) {
        case 'admin_requests_list':
            getAdminRequests($conn);
            break;
        
        case 'admin_requests_accept':
            acceptAdminRequest($conn);
            break;
        
        case 'admin_requests_reject':
            rejectAdminRequest($conn);
            break;
        
        case 'admins_list':
            getAdmins($conn);
            break;
        
        case 'admins_get_users':
            getUsers($conn);
            break;
        
        case 'admins_add':
            addAdmin($conn, $username);
            break;
        
        case 'admins_remove':
            removeAdmin($conn, $username);
            break;
        
        default:
            echo json_encode(["success" => false, "message" => "Invalid action"]);
            break;
    }

} catch (Exception $e) {
    error_log("Exception in OwnerAPI.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}

function getAdminRequests($conn) {
    // Fetch all admin requests
    $result = $conn->query("SELECT r.username, u.email FROM reports r LEFT JOIN users u ON r.username = u.username WHERE r.type = 'admin_request'");
    if (!$result) {
        echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
        return;
    }
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = ["username" => $row['username'], "email" => $row['email'] ?? 'N/A'];
    }
    
    echo json_encode(["success" => true, "requests" => $requests]);
}

function acceptAdminRequest($conn) {
    $target = $_POST['username'] ?? '';
    if (!$target) {
        echo json_encode(["success" => false, "message" => "No username provided"]);
        return;
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
}

function rejectAdminRequest($conn) {
    $target = $_POST['username'] ?? '';
    if (!$target) {
        echo json_encode(["success" => false, "message" => "No username provided"]);
        return;
    }
    // Remove the request
    $stmt = $conn->prepare("DELETE FROM reports WHERE username = ? AND type = 'admin_request'");
    $stmt->bind_param("s", $target);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(["success" => $success]);
}

function getAdmins($conn) {
    // Fetch all admins
    $result = $conn->query("SELECT username FROM users WHERE is_admin = 1");
    if (!$result) {
        echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
        return;
    }
    
    $admins = [];
    while ($row = $result->fetch_assoc()) {
        $admins[] = ["username" => $row['username']];
    }
    echo json_encode(["success" => true, "admins" => $admins]);
}

function getUsers($conn) {
    // Fetch all non-admin users for promotion
    $result = $conn->query("SELECT username, email FROM users WHERE is_admin = 0 ORDER BY username");
    if (!$result) {
        echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
        return;
    }
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = ["username" => $row['username'], "email" => $row['email']];
    }
    echo json_encode(["success" => true, "users" => $users]);
}

function addAdmin($conn, $username) {
    $target = $_POST['username'] ?? '';
    if (!$target) {
        echo json_encode(["success" => false, "message" => "No username provided"]);
        return;
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
        return;
    }
    
    if ($isAdmin == 1) {
        echo json_encode(["success" => false, "message" => "User is already an admin"]);
        return;
    }
    
    // Promote user to admin
    $stmt = $conn->prepare("UPDATE users SET is_admin = 1 WHERE username = ?");
    $stmt->bind_param("s", $target);
    $success = $stmt->execute();
    $stmt->close();
    
    echo json_encode(["success" => $success]);
}

function removeAdmin($conn, $username) {
    $target = $_POST['username'] ?? '';
    if (!$target) {
        echo json_encode(["success" => false, "message" => "No username provided"]);
        return;
    }
    // Prevent owner from removing themselves
    if ($target === $username) {
        echo json_encode(["success" => false, "message" => "You cannot remove yourself as admin."]);
        return;
    }
    $stmt = $conn->prepare("UPDATE users SET is_admin = 0 WHERE username = ?");
    $stmt->bind_param("s", $target);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(["success" => $success]);
}
?>
