<?php
require_once '../../../db.php';
header('Content-Type: application/json');

session_start();

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit();
}

// Collect filters
$sports = isset($_GET['sports']) ? $_GET['sports'] : [];
$search = isset($_GET['search']) ? trim($_GET['search']) : "";

$conditions = ["is_Accepted = 1"];
$params = [];
$types = "";

// Filter by sports
if (!empty($sports)) {
    $placeholders = implode(',', array_fill(0, count($sports), '?'));
    $conditions[] = "SportCategory IN ($placeholders)";
    $params = array_merge($params, $sports);
    $types .= str_repeat('s', count($sports));
}

// Filter by venue name start
if (!empty($search)) {
    $conditions[] = "place_name LIKE ?";
    $params[] = $search . '%';
    $types .= 's';
}

$whereClause = implode(" AND ", $conditions);

// Get current user's username for favorite check
$current_user = isset($_SESSION['username']) ? $_SESSION['username'] : '';

$sql = "
  SELECT 
    f.*, 
    COALESCE(ROUND(AVG(r.rating_value), 1), 0) AS avg_rating,
    CASE WHEN fav.facility_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
  FROM sportfacilities f
  LEFT JOIN ratings r ON f.facilities_id = r.facilities_id 
  LEFT JOIN user_favorite_facilities fav ON f.facilities_id = fav.facility_id AND fav.user_id = ?
  WHERE $whereClause
  GROUP BY f.facilities_id
";

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types . 's', ...array_merge($params, [$current_user]));
} else {
    $stmt->bind_param('s', $current_user);
}

$stmt->execute();
$result = $stmt->get_result();

$venues = [];
while ($row = $result->fetch_assoc()) {
    $venues[] = $row;
}

echo json_encode(["success" => true, "venues" => $venues]);
?>
