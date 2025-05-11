<?php
session_start();
require_once '../../db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../Login_Page/Login.php');
    exit();
}

// Process form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'process_venue.php';
}

// Fetch sports for dropdown
$sportsStmt = $conn->prepare("SELECT sport_name FROM sports WHERE is_Accepted = 1");
$sportsStmt->execute();
$sportsResult = $sportsStmt->get_result();
$sports = [];
while ($sport = $sportsResult->fetch_assoc()) {
    $sports[] = $sport['sport_name'];
}

// Include HTML template
include 'ManageVenue.html';
?>