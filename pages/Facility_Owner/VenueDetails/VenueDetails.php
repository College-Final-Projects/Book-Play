<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    // Redirect to login page if not logged in
    header('Location: ../../auth/Login_Page/Login.php');
    exit();
}

require_once '../../../db.php';
$_SESSION['previous_page'] = $_SERVER['PHP_SELF'];

// Get facility ID from URL
$facility_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($facility_id <= 0) {
    // Invalid facility ID, redirect back to manage venues
    header('Location: ../ManageVenue/ManageVenue.php');
    exit();
}

// Check if this facility belongs to the current user
$username = $_SESSION['username'];
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ? AND owner_username = ?");
$stmt->bind_param("is", $facility_id, $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Facility not found or doesn't belong to current user
    echo "<script>alert('Facility not found or you do not have permission to view it.'); window.location.href = '../ManageVenue/ManageVenue.php';</script>";
    exit();
}

$facility = $result->fetch_assoc();
$stmt->close();

// Include the navbar for facility owners
include '../navbar.php';

// Include the venue details HTML (we'll use the player's HTML as a base)
include '../../player/VenueDetails/VenueDetails.html';
exit;
?>
