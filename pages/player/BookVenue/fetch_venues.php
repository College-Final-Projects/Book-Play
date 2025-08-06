<?php
require_once '../../../db.php';
header('Content-Type: application/json');


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
$sql = "
  SELECT f.*, ROUND(AVG(r.rating_value), 1) AS avg_rating
  FROM sportfacilities f
  LEFT JOIN ratings r ON f.facilities_id = r.facilities_id 
  WHERE $whereClause
  GROUP BY f.facilities_id
";


$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$venues = [];
while ($row = $result->fetch_assoc()) {
    $venues[] = $row;
}

echo json_encode(["success" => true, "venues" => $venues]);
?>
