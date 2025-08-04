<?php
session_start();
require_once '../../../db.php';
$currentUsername = $_SESSION['user_id'] ?? '';

// Check if this is a view-only mode (from JoinGroup image click)
$viewOnly = isset($_GET['view_only']) && $_GET['view_only'] === 'true';

include 'BookingDetails.html';

// expose the logged in user and view_only status to JavaScript
echo "<script>window.currentUsername = " . json_encode($currentUsername) . ";</script>";
echo "<script>window.viewOnly = " . json_encode($viewOnly) . ";</script>";

exit();
?>