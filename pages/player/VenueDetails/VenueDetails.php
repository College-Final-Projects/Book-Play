<?php
session_start();
require_once '../../../db.php';

// Store the previous page URL (HTTP_REFERER) for back button functionality
// Only store if it's not an API call and not the same page
if (isset($_SERVER['HTTP_REFERER']) && 
    strpos($_SERVER['HTTP_REFERER'], $_SERVER['HTTP_HOST']) !== false &&
    !isset($_GET['action']) && // Don't store on API calls
    strpos($_SERVER['HTTP_REFERER'], 'VenueDetails.php') === false) { // Don't store if coming from same page
    $_SESSION['previous_page'] = $_SERVER['HTTP_REFERER'];
    error_log("VenueDetails: Stored previous page: " . $_SERVER['HTTP_REFERER']);
}

// ✅ API to get previous page URL (for back button)
if (isset($_GET['action']) && $_GET['action'] === 'get_previous_page') {
    header('Content-Type: application/json');
    $previousPage = $_SESSION['previous_page'] ?? '';
    error_log("VenueDetails: Returning previous page: " . $previousPage);
    echo json_encode([
        'url' => $previousPage,
        'debug' => [
            'session_previous_page' => $_SESSION['previous_page'] ?? 'not set',
            'http_referer' => $_SERVER['HTTP_REFERER'] ?? 'not set',
            'current_url' => $_SERVER['REQUEST_URI'] ?? 'not set'
        ]
    ]);
    exit;
}

// ✅ Check request to fetch user image
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