<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_name = $_SESSION['username'];

$query = "
    SELECT 
        sf.facilities_id, 
        sf.place_name, 
        sf.location, 
        sf.image_url, 
        sf.SportCategory,
        ROUND(AVG(r.rating_value), 1) AS avg_rating
    FROM sportfacilities sf
    INNER JOIN bookings b ON sf.facilities_id = b.facilities_id
    LEFT JOIN ratings r ON sf.facilities_id = r.facilities_id AND r.rating_value > 0
    WHERE sf.owner_username = ? AND sf.is_Accepted = 1
    GROUP BY sf.facilities_id
    HAVING COUNT(b.booking_id) > 0
";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $user_name);
$stmt->execute();
$result = $stmt->get_result();

$venues = [];

while ($row = $result->fetch_assoc()) {
    $venues[] = [
        'id' => $row['facilities_id'],
        'name' => $row['place_name'],
        'location' => $row['location'],
        'image' => $row['image_url'],
        'sport' => $row['SportCategory'],
        'rating' => $row['avg_rating'] ? $row['avg_rating'] : 'N/A'
    ];
}

echo json_encode(['success' => true, 'venues' => $venues]);
?>
