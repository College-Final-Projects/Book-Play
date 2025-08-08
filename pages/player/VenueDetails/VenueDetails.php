<?php
session_start();
require_once '../../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// ✅ 1. Check request to fetch user image
if (isset($_GET['action']) && $_GET['action'] === 'get_user_image') {
    $username = $_SESSION['username'] ?? '';

    if (!$username) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }
}

include 'VenueDetails.html';
exit;
?>