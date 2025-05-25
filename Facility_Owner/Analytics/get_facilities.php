<?php
session_start();
require_once '../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$username = $_SESSION['username'];

$sql = "SELECT f.facilities_id, f.place_name, f.image_url, f.price, f.is_Accepted, f.description, f.location,
               (SELECT COUNT(*) FROM bookings b WHERE b.facilities_id = f.facilities_id) AS bookings_count
        FROM facilities f
        WHERE f.owner_username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$venues = [];

while ($row = $result->fetch_assoc()) {
    $venues[] = [
        'id' => (int)$row['facilities_id'],
        'name' => $row['place_name'],
        'image' => $row['image_url'] ?: 'default.jpg',
        'price' => (float)$row['price'],
        'isAccepted' => (bool)$row['is_Accepted'],
        'description' => $row['description'] ?? '',
        'location' => $row['location'] ?? '',
        'bookings' => (int)$row['bookings_count']
    ];
}

echo json_encode($venues);
