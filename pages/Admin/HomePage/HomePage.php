<?php
session_start();
require_once '../../../db.php';    
// Save current page as the last visited (for back button or redirects)
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// ✅ 1. Handle AJAX request to get user image and username
if (isset($_GET['action']) && $_GET['action'] === 'get_user_image') {
    $username = $_SESSION['user_id'] ?? '';

    if (!$username) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    $stmt = $conn->prepare("SELECT user_image, username FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        echo json_encode([
            'image' => $user['user_image'],
            'username' => $user['username']
        ]);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    exit;
}

// ✅ 2. Protect this page: only accessible if user is an admin

$user_name = $_SESSION['user_id'] ?? null;

if (!$user_name) {
    // No user session – redirect to login
    header('Location: ../../auth/Login_Page/Login.php');
    exit;
}

$stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $user_name);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

// If not an admin, log them out and redirect
if (!$user || $user['is_admin'] != 1) {
    session_unset();
    session_destroy();
    header('Location: ../../auth/Login_Page/Login.php');
    exit();
}

// ✅ 3. Load admin homepage HTML if access is allowed
include 'HomePage.html';
exit;
?>
