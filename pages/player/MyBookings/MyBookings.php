<?php
session_start();
require_once '../../../db.php';

// Check if this is an AJAX request using query string
if (isset($_GET['ajax']) && $_GET['ajax'] === '1') {
    header('Content-Type: application/json');

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }

    $username = $_SESSION['user_id'];

    $sql = "SELECT b.*, s.place_name, s.image_url, s.price, s.location
        FROM bookings b
        JOIN sportfacilities s ON b.facilities_id = s.facilities_id
        WHERE b.username = ?
        ORDER BY b.booking_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }

    echo json_encode(['success' => true, 'bookings' => $bookings]);
    exit;
}

// Not AJAX request? Load full HTML page
include '../navbar.php';
include 'MyBookings.html';
exit;

?>