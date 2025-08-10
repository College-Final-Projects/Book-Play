<?php
session_start();
require_once '../../../db.php';

// Check if this is an AJAX request using query string
if (isset($_GET['ajax']) && $_GET['ajax'] === '1') {
    header('Content-Type: application/json');

    if (!isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }

    $username = $_SESSION['username'];

    // Get direct bookings (where user is the owner)
    $directBookingsSql = "SELECT b.*, s.place_name, s.image_url, s.price, s.location, 'owner' as user_role
        FROM bookings b
        JOIN sportfacilities s ON b.facilities_id = s.facilities_id
        WHERE b.username = ?
        ORDER BY b.booking_date DESC";

    // Get group member bookings (where user is a member of a group, but NOT the host)
    $groupBookingsSql = "SELECT b.*, s.place_name, s.image_url, s.price, s.location, 'member' as user_role, g.group_id, g.group_name
        FROM bookings b
        JOIN sportfacilities s ON b.facilities_id = s.facilities_id
        JOIN groups g ON b.booking_id = g.booking_id
        JOIN group_members gm ON g.group_id = gm.group_id
        WHERE gm.username = ? AND g.created_by != ?
        ORDER BY b.booking_date DESC";

    // Execute direct bookings query
    $stmt1 = $conn->prepare($directBookingsSql);
    $stmt1->bind_param("s", $username);
    $stmt1->execute();
    $directResult = $stmt1->get_result();

    // Execute group bookings query
    $stmt2 = $conn->prepare($groupBookingsSql);
    $stmt2->bind_param("ss", $username, $username);
    $stmt2->execute();
    $groupResult = $stmt2->get_result();

    $bookings = [];
    
    // Add direct bookings
    while ($row = $directResult->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    // Add group bookings
    while ($row = $groupResult->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    // Sort all bookings by date (most recent first)
    usort($bookings, function($a, $b) {
        return strtotime($b['booking_date']) - strtotime($a['booking_date']);
    });

    echo json_encode(['success' => true, 'bookings' => $bookings]);
    exit;
}

// Not AJAX request? Load full HTML page
include '../navbar.php';
include 'MyBookings.html';
exit;

?>