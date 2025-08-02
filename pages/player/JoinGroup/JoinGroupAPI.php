<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

// Simple database connection - try the most likely path first
$db_file = '../../../db.php';
if (!file_exists($db_file)) {
    $db_file = '../../../../db.php';
}
if (!file_exists($db_file)) {
    $db_file = 'C:/wamp64/www/Book-Play-main/Book-Play-main/db.php';
}

if (!file_exists($db_file)) {
    echo json_encode([
        "success" => false,
        "message" => "Database file not found"
    ]);
    exit();
}

include $db_file;

if (!isset($conn) || $conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

// Query for groups with facility price (not booking price)
$query = "
  SELECT 
    g.*,
    f.place_name,
    f.location,
    f.image_url,
    f.SportCategory,
    f.price,
    f.latitude,
    f.longitude,
    (SELECT AVG(r.rating_value) FROM ratings r WHERE r.facilities_id = f.facilities_id) AS rating,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.group_id) AS current_members
  FROM groups g
  JOIN sportfacilities f ON g.facilities_id = f.facilities_id
";

$result = $conn->query($query);

$groups = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Fix image URL to be absolute
        if (!empty($row['image_url']) && strpos($row['image_url'], 'http') !== 0) {
            $row['image_url'] = '/Book-Play-main/Book-Play-main/uploads/venues/' . basename($row['image_url']);
        }
        
        // Fix price to show actual price instead of 0
        if ($row['price'] == '0' || empty($row['price'])) {
            $row['price'] = 'Free';
        }
        
        $groups[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "groups" => $groups
]);
?>