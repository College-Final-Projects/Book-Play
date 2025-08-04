<?php
header('Content-Type: application/json');
include '../../../db.php';

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
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.group_id) AS current_members
  FROM groups g
  JOIN sportfacilities f ON g.facilities_id = f.facilities_id
  LEFT JOIN bookings b ON g.booking_id = b.booking_id
";

$result = mysqli_query($conn, $query);

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
  "groups" => $groups
]);
?>