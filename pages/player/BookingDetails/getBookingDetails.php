<?php
require_once '../../../db.php'; // adjust path as needed
header('Content-Type: application/json');

// Set timezone to match the application's timezone
date_default_timezone_set('Asia/Jerusalem'); // Adjust to your local timezone

// Get current user from session
session_start();
$current_user = isset($_SESSION['username']) ? $_SESSION['username'] : null;

$bookingId = $_GET['booking_id'] ?? null;

if (!$bookingId) {
    echo json_encode(['error' => 'Missing booking_id']);
    exit;
}

// ✅ Get booking data + group + venue
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

// ✅ Get players
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
  ORDER BY is_host DESC, u.username ASC
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

// ✅ Ensure only one host and fix image paths
$hostFound = false;
while ($row = $playersResult->fetch_assoc()) {
    // Fix player image path
    if ($row['user_image'] && !empty($row['user_image'])) {
        $row['user_image'] = '../../../uploads/users/' . $row['user_image'];
    } else {
        $row['user_image'] = '../../../uploads/users/default.jpg';
    }
    
    // Ensure only one host
    if ($row['is_host'] == 1) {
        if ($hostFound) {
            $row['is_host'] = 0; // Convert additional hosts to regular players
        } else {
            $hostFound = true;
        }
    }
    
    $players[] = $row;
}

// ✅ Calculate total price
$start = new DateTime($booking['start_time']);
$end = new DateTime($booking['end_time']);
$intervalInSeconds = ($end->getTimestamp() - $start->getTimestamp());
$hours = $intervalInSeconds / 3600;
$totalPrice = round($booking['price'] * $hours, 2);

// ✅ Calculate countdown timers and payment status
$now = new DateTime();
$bookingCreated = new DateTime($booking['created_at']);
$bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['start_time']);
$twentyFourHoursBefore = clone $bookingDateTime;
$twentyFourHoursBefore->sub(new DateInterval('P1D')); // Subtract 24 hours

// Calculate 20% of total venue price
$twentyPercentAmount = round($totalPrice * 0.20, 2);

// Calculate total amount paid by all players
$totalPaidQuery = "SELECT SUM(payment_amount) as total_paid FROM group_members WHERE group_id = ?";
$stmt3 = $conn->prepare($totalPaidQuery);
$stmt3->bind_param("i", $booking['group_id']);
$stmt3->execute();
$paymentResult = $stmt3->get_result();
$paymentData = $paymentResult->fetch_assoc();
$totalPaid = floatval($paymentData['total_paid'] ?? 0);
$stmt3->close();

// Determine countdown phase and calculate remaining time
$countdownPhase = 1;
$countdownEndTime = null;
$countdownSeconds = 0;
$paymentDeadlineMet = $totalPaid >= $twentyPercentAmount;

if (!$paymentDeadlineMet) {
    // Phase 1: From booking creation, need to pay 20%
    // Set to exactly 1 hour from booking creation
    $firstDeadline = clone $bookingCreated;
    $firstDeadline->add(new DateInterval('PT1H')); // Add 1 hour
    
    if ($now < $firstDeadline) {
        $countdownPhase = 1;
        $countdownEndTime = $firstDeadline;
        $countdownSeconds = $firstDeadline->getTimestamp() - $now->getTimestamp();
    } else {
        // First deadline passed without 20% payment - booking should be cancelled
        $countdownPhase = 1;
        $countdownSeconds = 0; // Expired
    }
} else {
    // Phase 2: 20% paid, countdown to 24 hours before booking
    if ($now < $twentyFourHoursBefore) {
        $countdownPhase = 2;
        $countdownEndTime = $twentyFourHoursBefore;
        $countdownSeconds = $twentyFourHoursBefore->getTimestamp() - $now->getTimestamp();
    } else {
        // Second deadline passed - check if full payment made
        $fullPaymentMet = $totalPaid >= $totalPrice;
        $countdownPhase = 2;
        $countdownSeconds = 0; // Expired
    }
}

// ✅ Fix venue image path
$venueImage = '';
if ($booking['image_url'] && !empty($booking['image_url'])) {
    $venueImage = '../../../uploads/venues/' . str_replace('\\', '/', $booking['image_url']);
} else {
    $venueImage = '../../../Images/staduim_icon.png'; // Default image
}

// ✅ Determine current user's role
$currentUserRole = 'guest'; // Default role
$currentUserIsHost = false;
$currentUserIsMember = false;

if ($current_user) {
    // Check if current user is a member of this group
    $memberCheckQuery = "SELECT COUNT(*) as is_member FROM group_members WHERE group_id = ? AND username = ?";
    $stmt4 = $conn->prepare($memberCheckQuery);
    $stmt4->bind_param("is", $booking['group_id'], $current_user);
    $stmt4->execute();
    $memberResult = $stmt4->get_result();
    $memberData = $memberResult->fetch_assoc();
    $currentUserIsMember = $memberData['is_member'] > 0;
    $stmt4->close();

    if ($currentUserIsMember) {
        // Check if current user is the host
        $hostCheckQuery = "SELECT COUNT(*) as is_host FROM groups WHERE group_id = ? AND created_by = ?";
        $stmt5 = $conn->prepare($hostCheckQuery);
        $stmt5->bind_param("is", $booking['group_id'], $current_user);
        $stmt5->execute();
        $hostResult = $stmt5->get_result();
        $hostData = $hostResult->fetch_assoc();
        $currentUserIsHost = $hostData['is_host'] > 0;
        $stmt5->close();

        if ($currentUserIsHost) {
            $currentUserRole = 'host';
        } else {
            $currentUserRole = 'member';
        }
    }
}

// ✅ Send complete data
echo json_encode([
  'booking' => [
    'place_name' => $booking['group_name'],
    'venue_location' => $booking['venue_location'],
    'venue_image' => $venueImage,
    'booking_date' => $booking['booking_date'],
    'booking_time' => $booking['start_time'] . ' - ' . $booking['end_time'],
    'booking_id' => $booking['booking_id'],
    'total_price' => $totalPrice,
    'privacy' => $booking['privacy'],
    'group_password' => $booking['group_password'],
    'group_id' => $booking['group_id'],
    'created_at' => $booking['created_at'],
    'booking_datetime' => $booking['booking_date'] . ' ' . $booking['start_time']
  ],
  'countdown' => [
    'phase' => $countdownPhase,
    'seconds_remaining' => max(0, $countdownSeconds),
    'end_time' => $countdownEndTime ? $countdownEndTime->format('Y-m-d H:i:s') : null,
    'twenty_percent_amount' => $twentyPercentAmount,
    'total_paid' => $totalPaid,
    'payment_deadline_met' => $paymentDeadlineMet,
    'full_payment_required' => $totalPrice
  ],
  'players' => $players,
  'current_user' => [
    'username' => $current_user,
    'role' => $currentUserRole,
    'is_host' => $currentUserIsHost,
    'is_member' => $currentUserIsMember
  ]
]);
?>