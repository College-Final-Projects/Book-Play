<?php
session_start();
require_once '../../db.php';
header('Content-Type: application/json');

// التحقق من وجود المستخدم
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_name = $_SESSION['user_id'];

$query = "
    SELECT f.facilities_id, f.place_name, f.location, f.image_url, f.SportCategory,
           ROUND(AVG(r.rating_value), 1) AS avg_rating
    FROM sportfacilities f
    LEFT JOIN ratings r ON r.facilities_id = f.facilities_id
    WHERE EXISTS (
        SELECT 1 FROM bookings b WHERE b.facilities_id = f.facilities_id
    )
    AND f.is_Accepted = 1
    AND f.owner_username = ?
    GROUP BY f.facilities_id
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
        'rating' => $row['avg_rating'] ?? 'N/A'
    ];
}

echo json_encode(['success' => true, 'venues' => $venues]);
?>
