<?php
session_start();

$currentUsername = $_SESSION['user_id'] ?? '';

include 'BookingDetails.html';

// expose the logged in user to JavaScript
echo "<script>window.currentUsername = " . json_encode($currentUsername) . ";</script>";

exit();
?>