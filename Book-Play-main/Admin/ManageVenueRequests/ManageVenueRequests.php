<?php
session_start();
require_once '../../db.php'; 
// Check if user is admin by querying the database
$user_name = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT * FROM users WHERE username  = ?");
$stmt->bind_param("s", $user_name);
$stmt->execute();
$result = $stmt->get_result();

if (!isset($_SESSION['user_id']) || $result->fetch_assoc()['is_admin'] != 1) {
    // Unset all session variables
    session_unset();
    // Destroy the session completely
    session_destroy();
    header('Location: ../../Login_Page/Login.php');
    exit();
}
include 'ManageVenueRequests.html';
exit();
?>