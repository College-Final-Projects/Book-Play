<?php
require_once '../../db.php';
header('Content-Type: application/json');

$facilityId = $_GET['facilities_id'] ?? null;

if (!$facilityId) {
    echo json_encode(['success' => false, 'message' => 'Facility ID missing']);
    exit;
}

$query = "
    SELECT username, start_time, end_time
    FROM bookings
    WHERE facilities_id = ?
    ORDER BY booking_date DESC, start_time
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $facilityId);
$stmt->execute();
$result = $stmt->get_result();

$bookings = [];
while ($row = $result->fetch_assoc()) {
    $bookings[] = [
        'username' => $row['username'],
        'time' => $row['start_time'] . ' - ' . $row['end_time'],
        'players' => rand(5, 10) . '/10' // مؤقتًا للتجربة
    ];
}

echo json_encode(['success' => true, 'bookings' => $bookings]);
?>