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

if (!$group_id) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid group ID"
    ]);
    exit;
}

// Check if user is a member of this group
$member_check_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND username = ?";
$member_check_stmt = mysqli_prepare($conn, $member_check_query);
mysqli_stmt_bind_param($member_check_stmt, "is", $group_id, $current_user);
mysqli_stmt_execute($member_check_stmt);
$member_check_result = mysqli_stmt_get_result($member_check_stmt);
$member_check_row = mysqli_fetch_assoc($member_check_result);

if ($member_check_row['count'] == 0) {
    echo json_encode([
        "success" => false,
        "error" => "You are not a member of this group"
    ]);
    exit;
}

// Check if user is the host
$host_check_query = "SELECT COUNT(*) as count FROM groups WHERE group_id = ? AND created_by = ?";
$host_check_stmt = mysqli_prepare($conn, $host_check_query);
mysqli_stmt_bind_param($host_check_stmt, "is", $group_id, $current_user);
mysqli_stmt_execute($host_check_stmt);
$host_check_result = mysqli_stmt_get_result($host_check_stmt);
$host_check_row = mysqli_fetch_assoc($host_check_result);

if ($host_check_row['count'] > 0) {
    echo json_encode([
        "success" => false,
        "error" => "Host cannot leave the group. Please transfer host role to another member first."
    ]);
    exit;
}

// Get group details to check if this is the last member
$member_count_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?";
$member_count_stmt = mysqli_prepare($conn, $member_count_query);
mysqli_stmt_bind_param($member_count_stmt, "i", $group_id);
mysqli_stmt_execute($member_count_stmt);
$member_count_result = mysqli_stmt_get_result($member_count_stmt);
$member_count_row = mysqli_fetch_assoc($member_count_result);

if ($member_count_row['count'] <= 1) {
    echo json_encode([
        "success" => false,
        "error" => "Cannot leave group as you are the last member"
    ]);
    exit;
}

// Remove user from group_members
$delete_query = "DELETE FROM group_members WHERE group_id = ? AND username = ?";
$delete_stmt = mysqli_prepare($conn, $delete_query);
mysqli_stmt_bind_param($delete_stmt, "is", $group_id, $current_user);

if (mysqli_stmt_execute($delete_stmt)) {
    echo json_encode([
        "success" => true,
        "message" => "Successfully left the group"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Failed to leave group: " . mysqli_error($conn)
    ]);
}
?>