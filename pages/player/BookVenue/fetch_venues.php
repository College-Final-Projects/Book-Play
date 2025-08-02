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

// Simple query without complex filtering for now
$sql = "SELECT f.*, ROUND(AVG(r.rating_value), 1) AS avg_rating 
        FROM sportfacilities f
        LEFT JOIN ratings r ON f.facilities_id = r.facilities_id 
        WHERE f.is_Accepted = 1
        GROUP BY f.facilities_id";

$result = $conn->query($sql);

$venues = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Fix image URL
        if (!empty($row['image_url']) && strpos($row['image_url'], 'http') !== 0) {
            $row['image_url'] = '/Book-Play-main/Book-Play-main/uploads/venues/' . basename($row['image_url']);
        }
        
        // Fix price display
        if ($row['price'] == 0) {
            $row['price'] = 'Free';
        }
        
        $venues[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "venues" => $venues
]);
?>