<?php
header('Content-Type: application/json');
include '../../../db.php';

session_start();
$current_user = isset($_SESSION['username']) ? $_SESSION['username'] : null;

if (!$current_user) {
    echo json_encode(["success" => false, "error" => "User not logged in"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');

if ($method === 'GET' && $action === 'list') {
    $query = "
      SELECT 
        g.*,
        f.place_name,
        f.location,
        f.image_url,
        f.SportCategory,
        b.Total_Price AS price,
        f.latitude,
        f.longitude,
        (SELECT AVG(r.rating_value) FROM ratings r WHERE r.facilities_id = f.facilities_id) AS rating,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.group_id) AS current_members,
        g.max_members,
        CASE WHEN gm2.username IS NOT NULL THEN 1 ELSE 0 END AS is_member
      FROM groups g
      JOIN sportfacilities f ON g.facilities_id = f.facilities_id
      LEFT JOIN bookings b ON g.booking_id = b.booking_id
      LEFT JOIN group_members gm2 ON g.group_id = gm2.group_id AND gm2.username = ?
    ";

    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "s", $current_user);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $groups = [];

    while ($row = mysqli_fetch_assoc($result)) {
      if ($row['image_url'] && !empty($row['image_url'])) {
        $row['image_url'] = '../../../uploads/venues/' . $row['image_url'];
      } else {
        $row['image_url'] = '../../../Images/staduim_icon.png';
      }
      $groups[] = $row;
    }

    echo json_encode([
      "success" => true,
      "groups" => $groups,
      "current_user" => $current_user
    ]);
    exit;
}

if ($method === 'POST' && $action === 'join') {
    $group_id = isset($_POST['group_id']) ? intval($_POST['group_id']) : 0;
    $access_code = isset($_POST['access_code']) ? $_POST['access_code'] : '';

    if (!$group_id) {
        echo json_encode(["success" => false, "error" => "Invalid group ID"]);
        exit;
    }

    $check_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND username = ?";
    $check_stmt = mysqli_prepare($conn, $check_query);
    mysqli_stmt_bind_param($check_stmt, "is", $group_id, $current_user);
    mysqli_stmt_execute($check_stmt);
    $check_result = mysqli_stmt_get_result($check_stmt);
    $check_row = mysqli_fetch_assoc($check_result);

    if ($check_row['count'] > 0) {
        echo json_encode(["success" => false, "error" => "You are already a member of this group"]);
        exit;
    }

    $group_query = "SELECT * FROM groups WHERE group_id = ?";
    $group_stmt = mysqli_prepare($conn, $group_query);
    mysqli_stmt_bind_param($group_stmt, "i", $group_id);
    mysqli_stmt_execute($group_stmt);
    $group_result = mysqli_stmt_get_result($group_stmt);
    $group = mysqli_fetch_assoc($group_result);

    if (!$group) {
        echo json_encode(["success" => false, "error" => "Group not found"]);
        exit;
    }

    if ($group['privacy'] === 'private') {
        if (empty($access_code) || $access_code !== $group['group_password']) {
            echo json_encode(["success" => false, "error" => "Invalid access code for private group"]);
            exit;
        }
    }

    $member_count_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?";
    $member_count_stmt = mysqli_prepare($conn, $member_count_query);
    mysqli_stmt_bind_param($member_count_stmt, "i", $group_id);
    mysqli_stmt_execute($member_count_stmt);
    $member_count_result = mysqli_stmt_get_result($member_count_stmt);
    $member_count_row = mysqli_fetch_assoc($member_count_result);

    if ($member_count_row['count'] >= $group['max_members']) {
        echo json_encode(["success" => false, "error" => "Group is full"]);
        exit;
    }

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
        echo json_encode(["success" => false, "error" => "Failed to join group: " . mysqli_error($conn)]);
    }
    exit;
}

echo json_encode(["success" => false, "error" => "Invalid action"]);
?>