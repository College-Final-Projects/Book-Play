<?php
require_once '../../db.php'; // adjust path as needed
header('Content-Type: application/json');

$bookingId = $_GET['booking_id'] ?? null;

if (!$bookingId) {
    echo json_encode(['error' => 'Missing booking_id']);
    exit;
}

// ✅ جلب بيانات الحجز + المجموعة + المكان
$bookingSql = "
  SELECT 
    b.*, 
    g.group_id,
    g.group_name, 
    g.privacy,
    g.group_password,
    v.location AS venue_location, 
    v.image_url, 
    v.price, 
    v.SportCategory
  FROM bookings b
  LEFT JOIN groups g ON b.booking_id = g.booking_id
  JOIN sportfacilities v ON b.facilities_id = v.facilities_id
  WHERE b.booking_id = ?
";

$stmt = $conn->prepare($bookingSql);
if (!$stmt) {
    echo json_encode([
        "error" => "Booking query failed: " . $conn->error,
        "sql" => $bookingSql
    ]);
    exit;
}
$stmt->bind_param("i", $bookingId);
$stmt->execute();
$bookingResult = $stmt->get_result();
$booking = $bookingResult->fetch_assoc();

if (!$booking) {
    echo json_encode([
        "error" => "Booking not found with ID $bookingId"
    ]);
    exit;
}

// ✅ جلب اللاعبين
$playersSql = "
  SELECT 
    u.username, 
    u.user_image,
    gm.payment_amount AS price,
    CASE 
      WHEN u.username = g.created_by THEN 1 
      ELSE 0 
    END AS is_host
  FROM groups g
  JOIN group_members gm ON g.group_id = gm.group_id
  JOIN users u ON gm.username = u.username
  WHERE g.booking_id = ?
";

$stmt2 = $conn->prepare($playersSql);
if (!$stmt2) {
    echo json_encode([
        "error" => "Players query failed: " . $conn->error,
        "sql" => $playersSql
    ]);
    exit;
}
$stmt2->bind_param("i", $bookingId);
$stmt2->execute();
$playersResult = $stmt2->get_result();
$players = [];
while ($row = $playersResult->fetch_assoc()) {
    $players[] = $row;
}

// ✅ حساب السعر الكامل
$start = new DateTime($booking['start_time']);
$end = new DateTime($booking['end_time']);
$intervalInSeconds = ($end->getTimestamp() - $start->getTimestamp());
$hours = $intervalInSeconds / 3600;
$totalPrice = round($booking['price'] * $hours, 2);

// ✅ إرسال البيانات كاملة
echo json_encode([
  'booking' => [
    'place_name' => $booking['group_name'],
    'venue_location' => $booking['venue_location'],
    'venue_image' => str_replace('\\', '/', $booking['image_url']),
    'booking_date' => $booking['booking_date'],
    'booking_time' => $booking['start_time'] . ' - ' . $booking['end_time'],
    'booking_id' => $booking['booking_id'],
    'total_price' => $totalPrice,
    'privacy' => $booking['privacy'],
    'group_password' => $booking['group_password'],
    'group_id' => $booking['group_id']
  ],
  'players' => $players
]);
?>