
<?php
// Allow errors to be logged but prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set timezone to match the application's timezone
date_default_timezone_set('Asia/Jerusalem'); // Adjust to your local timezone

session_start();

// Handle different path contexts
$db_path = '../../../db.php';
if (!file_exists($db_path)) {
    $db_path = __DIR__ . '/../../../db.php';
    if (!file_exists($db_path)) {
        $db_path = dirname(dirname(dirname(__DIR__))) . '/db.php';
    }
}
require_once $db_path;

header('Content-Type: application/json');

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$bookingId = $_POST['booking_id'] ?? null;
$groupId = $_POST['group_id'] ?? null;

if (!$bookingId || !$groupId) {
    echo json_encode(['success' => false, 'error' => 'Missing required data']);
    exit;
}

// Get booking and payment information
$bookingSql = "
  SELECT 
    b.booking_id,
    b.booking_date, 
    b.start_time, 
    b.Total_Price as price,
    b.created_at
  FROM bookings b
  WHERE b.booking_id = ?
";

$stmt = $conn->prepare($bookingSql);
$stmt->bind_param("i", $bookingId);
$stmt->execute();
$bookingResult = $stmt->get_result();
$booking = $bookingResult->fetch_assoc();
$stmt->close();

if (!$booking) {
    echo json_encode(['success' => false, 'error' => 'Booking not found']);
    exit;
}

// Calculate total amount paid by all players
$totalPaidQuery = "SELECT SUM(payment_amount) as total_paid FROM group_members WHERE group_id = ?";
$stmt2 = $conn->prepare($totalPaidQuery);
$stmt2->bind_param("i", $groupId);
$stmt2->execute();
$paymentResult = $stmt2->get_result();
$paymentData = $paymentResult->fetch_assoc();
$totalPaid = floatval($paymentData['total_paid'] ?? 0);
$stmt2->close();

// Calculate timing and payment requirements
$now = new DateTime();
$bookingCreated = new DateTime($booking['created_at']);
$bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['start_time']);
$twentyFourHoursBefore = clone $bookingDateTime;
$twentyFourHoursBefore->sub(new DateInterval('P1D'));

// Calculate deadlines
$firstDeadline = clone $bookingCreated;
$firstDeadline->add(new DateInterval('PT1H')); // 1 hour from booking creation

$totalPrice = $booking['price'];
$twentyPercentAmount = round($totalPrice * 0.20, 2);
$paymentDeadlineMet = $totalPaid >= $twentyPercentAmount;
$fullPaymentMet = $totalPaid >= $totalPrice;

$shouldCancel = false;
$cancelReason = '';

// Check if booking should be cancelled
if (!$paymentDeadlineMet && $now > $firstDeadline) {
    // Phase 1 deadline passed without 20% payment
    $shouldCancel = true;
    $cancelReason = 'insufficient_deposit';
    error_log("Booking $bookingId should be cancelled - insufficient deposit payment");
} elseif ($paymentDeadlineMet && !$fullPaymentMet && $now > $twentyFourHoursBefore) {
    // Phase 2 deadline passed without full payment
    $shouldCancel = true;
    $cancelReason = 'incomplete_payment';
    error_log("Booking $bookingId should be cancelled - incomplete full payment");
}

// If booking should be cancelled, perform the cancellation
if ($shouldCancel) {
    error_log("Initiating cancellation for booking $bookingId - reason: $cancelReason");
    
    // Get all players for email notifications
    $playersQuery = "
        SELECT u.username, u.email, gm.payment_amount 
        FROM group_members gm
        JOIN users u ON gm.username = u.username
        WHERE gm.group_id = ?
    ";
    $stmt3 = $conn->prepare($playersQuery);
    $stmt3->bind_param("i", $groupId);
    $stmt3->execute();
    $playersResult = $stmt3->get_result();
    $players = [];
    while ($row = $playersResult->fetch_assoc()) {
        $players[] = $row;
    }
    $stmt3->close();
    
    // Begin transaction for safe deletion
    $conn->begin_transaction();
    
    try {
        // Delete from group_members
        $deleteMembers = $conn->prepare("DELETE FROM group_members WHERE group_id = ?");
        $deleteMembers->bind_param("i", $groupId);
        $deleteMembers->execute();
        $deleteMembers->close();
        
        // Delete from groups
        $deleteGroup = $conn->prepare("DELETE FROM groups WHERE group_id = ?");
        $deleteGroup->bind_param("i", $groupId);
        $deleteGroup->execute();
        $deleteGroup->close();
        
        // Delete from bookings
        $deleteBooking = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
        $deleteBooking->bind_param("i", $bookingId);
        $deleteBooking->execute();
        $deleteBooking->close();
        
        // Commit transaction
        $conn->commit();
        
        // TODO: Send email notifications to players
        // This would require implementing email functionality
        error_log("Booking $bookingId successfully cancelled and deleted");
        
        echo json_encode([
            'success' => true,
            'should_cancel' => true,
            'cancel_reason' => $cancelReason,
            'message' => 'Booking has been cancelled due to payment deadline',
            'players_to_notify' => count($players)
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        error_log("Error cancelling booking $bookingId: " . $e->getMessage());
        
        echo json_encode([
            'success' => false,
            'error' => 'Failed to cancel booking: ' . $e->getMessage()
        ]);
    }
} else {
    // Booking should remain active
    echo json_encode([
        'success' => true,
        'should_cancel' => false,
        'total_paid' => $totalPaid,
        'twenty_percent_amount' => $twentyPercentAmount,
        'payment_deadline_met' => $paymentDeadlineMet,
        'full_payment_met' => $fullPaymentMet
    ]);
}

$conn->close();
?>
