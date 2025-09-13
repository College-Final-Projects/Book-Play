<?php
session_start();
require_once '../../../db.php';

// Store the previous page URL (HTTP_REFERER) for back button functionality
// Only store if it's not an API call and not the same page
if (isset($_SERVER['HTTP_REFERER']) && 
    strpos($_SERVER['HTTP_REFERER'], $_SERVER['HTTP_HOST']) !== false &&
    !isset($_GET['action']) && // Don't store on API calls
    strpos($_SERVER['HTTP_REFERER'], 'VenueDetails.php') === false) { // Don't store if coming from same page
    
    $referrer = $_SERVER['HTTP_REFERER'];
    $referrer_lower = strtolower($referrer);
    
    // Check if it's a valid referrer (not logout or other invalid pages)
    $invalid_pages = ['logout', 'login', 'register', 'venuedetails'];
    $is_valid_referrer = true;
    
    foreach ($invalid_pages as $invalid_page) {
        if (strpos($referrer_lower, $invalid_page) !== false) {
            $is_valid_referrer = false;
            break;
        }
    }
    
    if ($is_valid_referrer) {
        $_SESSION['previous_page'] = $referrer;
        error_log("VenueDetails: Stored valid previous page: " . $referrer);
    } else {
        error_log("VenueDetails: Invalid referrer detected, not storing: " . $referrer);
    }
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