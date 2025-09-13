<?php
header('Content-Type: application/json');
include '../../../db.php';

// Get current user from session
session_start();
$current_user = isset($_SESSION['username']) ? $_SESSION['username'] : null;

if (!$current_user) {
    echo json_encode([
        "success" => false,
        "error" => "User not logged in"
    ]);
    exit;
}

// Get POST data
$group_id = isset($_POST['group_id']) ? intval($_POST['group_id']) : 0;
$access_code = isset($_POST['access_code']) ? $_POST['access_code'] : '';

if (!$group_id) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid group ID"
    ]);
    exit;
}

// Check if user is already a member
$check_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND username = ?";
$check_stmt = mysqli_prepare($conn, $check_query);
mysqli_stmt_bind_param($check_stmt, "is", $group_id, $current_user);
mysqli_stmt_execute($check_stmt);
$check_result = mysqli_stmt_get_result($check_stmt);
$check_row = mysqli_fetch_assoc($check_result);

if ($check_row['count'] > 0) {
    echo json_encode([
        "success" => false,
        "error" => "You are already a member of this group"
    ]);
    exit;
}

// Get group details to check privacy and access code
$group_query = "SELECT * FROM groups WHERE group_id = ?";
$group_stmt = mysqli_prepare($conn, $group_query);
mysqli_stmt_bind_param($group_stmt, "i", $group_id);
mysqli_stmt_execute($group_stmt);
$group_result = mysqli_stmt_get_result($group_stmt);
$group = mysqli_fetch_assoc($group_result);

if (!$group) {
    echo json_encode([
        "success" => false,
        "error" => "Group not found"
    ]);
    exit;
}

// Check if group is private and access code is required
if ($group['privacy'] === 'private') {
    if (empty($access_code) || $access_code !== $group['group_password']) {
        echo json_encode([
            "success" => false,
            "error" => "Invalid access code for private group"
        ]);
        exit;
    }
}

// Check if group is full
$member_count_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?";
$member_count_stmt = mysqli_prepare($conn, $member_count_query);
mysqli_stmt_bind_param($member_count_stmt, "i", $group_id);
mysqli_stmt_execute($member_count_stmt);
$member_count_result = mysqli_stmt_get_result($member_count_stmt);
$member_count_row = mysqli_fetch_assoc($member_count_result);

if ($member_count_row['count'] >= $group['max_members']) {
    echo json_encode([
        "success" => false,
        "error" => "Group is full"
    ]);
    exit;
}

// Get booking details to calculate payment
$booking_query = "SELECT Total_Price FROM bookings WHERE booking_id = ?";
$booking_stmt = mysqli_prepare($conn, $booking_query);
mysqli_stmt_bind_param($booking_stmt, "i", $group['booking_id']);
mysqli_stmt_execute($booking_stmt);
$booking_result = mysqli_stmt_get_result($booking_stmt);
$booking = mysqli_fetch_assoc($booking_result);

if (!$booking) {
    echo json_encode([
        "success" => false,
        "error" => "Booking not found"
    ]);
    exit;
}

// Insert user into group_members with required_payment = 0
$insert_query = "INSERT INTO group_members (group_id, username, payment_amount, required_payment) VALUES (?, ?, 0, 0)";
$insert_stmt = mysqli_prepare($conn, $insert_query);
mysqli_stmt_bind_param($insert_stmt, "is", $group_id, $current_user);

if (mysqli_stmt_execute($insert_stmt)) {
    echo json_encode([
        "success" => true,
        "message" => "Successfully joined the group",
        "booking_id" => $group['booking_id'],
        "redirect_url" => "../BookingDetails/BookingDetails.php?booking_id=" . $group['booking_id']
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Failed to join group: " . mysqli_error($conn)
    ]);
}
?>
