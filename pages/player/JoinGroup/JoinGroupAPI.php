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
  // Fix image path to include the correct uploads directory
  if ($row['image_url'] && !empty($row['image_url'])) {
    $row['image_url'] = '../../../uploads/venues/' . $row['image_url'];
  } else {
    $row['image_url'] = '../../../Images/staduim_icon.png'; // Default image
  }
  
  $groups[] = $row;
}

echo json_encode([
  "success" => true,
  "groups" => $groups,
  "current_user" => $current_user
]);
?>