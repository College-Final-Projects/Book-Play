<?php
session_start();
require_once '../../db.php'; // adjust path as needed
header('Content-Type: application/json');

$bookingId = $_GET['booking_id'] ?? null;
$currentUser = $_SESSION['user_id'] ?? '';

if (!$bookingId) {
    echo json_encode(['error' => 'Missing booking_id']);
    exit;
}

// ✅ جلب بيانات الحجز + المجموعة + المكان
$bookingSql = "
   SELECT 
    b.booking_id,
    b.booking_date,
    b.start_time,
    b.end_time,
    f.place_name,
    f.location AS venue_location,
    f.image_url AS venue_image,
    b.status,
    b.created_at,
    g.group_password,
    g.privacy,
    g.group_id,
    g.group_name,
    b.Total_Price AS total_price
  FROM bookings b
  JOIN groups g ON b.booking_id = g.booking_id
  JOIN sportfacilities f ON b.facilities_id = f.facilities_id
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
  gm.payment_amount,
  gm.required_payment,
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
    $filename = basename($row['user_image']); // تأكد من اسم الملف فقط
    $row['user_image'] = '../../uploads/users/' . $filename;
    $row['paid'] = (float)$row['payment_amount'];
    $row['price'] = (float)$row['required_payment'];
    $players[] = $row;
}

// ✅ إرسال البيانات كاملة
echo json_encode([
  'booking' => [
    'place_name' => $booking['group_name'],
    'venue_location' => $booking['venue_location'],
    'venue_image' => str_replace('\\', '/', $booking['venue_image']),
    'booking_date' => $booking['booking_date'],
    'booking_time' => $booking['start_time'] . ' - ' . $booking['end_time'],
    'booking_id' => $booking['booking_id'],
    'total_price' => (float)$booking['total_price'], // ✅ أخذ السعر من الجدول
    'privacy' => $booking['privacy'],
    'group_password' => $booking['group_password'],
    'group_id' => $booking['group_id'],
    'created_at' => $booking['created_at'] // ✅ مهم للعداد التنازلي
  ],
  'players' => $players,
  'current_user' => $currentUser,
]);
?>
