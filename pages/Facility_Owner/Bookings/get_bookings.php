<?php
require_once '../../../db.php';
header('Content-Type: application/json');

$facilityId = $_GET['facilities_id'] ?? null;

if (!$facilityId) {
    echo json_encode(['success' => false, 'message' => 'Facility ID missing']);
    exit;
}

$currentYear = date("Y");
$calendar = [];

// Prepare all months empty
$months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

foreach ($months as $month) {
    $calendar[$month] = [];
}

// Fill dates that have bookings
$query = "
  SELECT 
    DATE_FORMAT(booking_date, '%M') AS month_name,
    DATE_FORMAT(booking_date, '%Y-%m-%d') AS full_date
  FROM bookings
  WHERE facilities_id = ? AND YEAR(booking_date) = ?
  GROUP BY full_date
  ORDER BY full_date ASC
";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $facilityId, $currentYear);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $month = $row['month_name'];
    $calendar[$month][] = $row['full_date'];
}

// Display table bookings
$query2 = "
   SELECT 
        b.booking_id,
        b.username,
        b.start_time,
        b.end_time,
        DATE(b.booking_date) AS booking_date,
        COUNT(gm.username) AS member_count,
        g.max_members
    FROM bookings b
    LEFT JOIN groups g ON g.booking_id = b.booking_id
    LEFT JOIN group_members gm ON gm.group_id = g.group_id
    WHERE b.facilities_id = ?
    GROUP BY b.booking_id
    ORDER BY b.booking_date DESC, b.start_time ASC
";
$stmt2 = $conn->prepare($query2);
$stmt2->bind_param("i", $facilityId);
$stmt2->execute();
$result2 = $stmt2->get_result();

$bookings = [];
while ($row = $result2->fetch_assoc()) {
    $playersDisplay = isset($row['max_members']) 
        ? $row['member_count'] . '/' . $row['max_members'] 
        : '0/0'; // in case there's no group

    $bookings[] = [
        'username' => $row['username'],
        'time' => $row['start_time'] . ' - ' . $row['end_time'],
        'players' => $playersDisplay,
        'date' => $row['booking_date']
    ];
}


echo json_encode([
    'success' => true,
    'calendar' => $calendar,
    'bookings' => $bookings
]);
?>
