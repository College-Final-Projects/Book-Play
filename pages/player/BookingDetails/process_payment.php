<?php
session_start();
header('Content-Type: application/json');

// Handle different path contexts
$db_path = '../../../db.php';
if (!file_exists($db_path)) {
    $db_path = __DIR__ . '/../../../db.php';
    if (!file_exists($db_path)) {
        $db_path = dirname(dirname(dirname(__DIR__))) . '/db.php';
    }
}
require_once $db_path;

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$currentUsername = $_SESSION['username'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid input data']);
    exit;
}

$groupId = $input['group_id'] ?? null;
$bookingId = $input['booking_id'] ?? null;
$payInitialDeposit = $input['pay_initial_deposit'] ?? false;
$paymentMethod = $input['payment_method'] ?? 'credit';

if (!$groupId || !$bookingId) {
    echo json_encode(['success' => false, 'error' => 'Missing required data']);
    exit;
}

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

try {
    // Begin transaction
    $conn->begin_transaction();
    
    // Get booking information
    $bookingSql = "SELECT Total_Price FROM bookings WHERE booking_id = ?";
    $stmt = $conn->prepare($bookingSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $bookingResult = $stmt->get_result();
    $booking = $bookingResult->fetch_assoc();
    $stmt->close();
    
    if (!$booking) {
        throw new Exception('Booking not found');
    }
    
    $totalPrice = $booking['Total_Price'];
    $twentyPercentAmount = round($totalPrice * 0.20, 2);
    
    // Get current user's payment information
    $userPaymentSql = "SELECT payment_amount, required_payment FROM group_members WHERE group_id = ? AND username = ?";
    $stmt = $conn->prepare($userPaymentSql);
    $stmt->bind_param("is", $groupId, $currentUsername);
    $stmt->execute();
    $userPaymentResult = $stmt->get_result();
    $userPayment = $userPaymentResult->fetch_assoc();
    $stmt->close();
    
    if (!$userPayment) {
        throw new Exception('User is not a member of this group');
    }
    
    $currentPaymentAmount = $userPayment['payment_amount'] ?? 0;
    $requiredPayment = $userPayment['required_payment'] ?? 0;
    
    // Calculate total paid by all members
    $totalPaidSql = "SELECT SUM(payment_amount) as total_paid FROM group_members WHERE group_id = ?";
    $stmt = $conn->prepare($totalPaidSql);
    $stmt->bind_param("i", $groupId);
    $stmt->execute();
    $totalPaidResult = $stmt->get_result();
    $totalPaidData = $totalPaidResult->fetch_assoc();
    $totalPaidByAll = $totalPaidData['total_paid'] ?? 0;
    $stmt->close();
    
    // Calculate payment amount
    $baseAmountToPay = $requiredPayment - $currentPaymentAmount;
    $paymentAmount = $baseAmountToPay;
    
    if ($payInitialDeposit) {
        // Calculate remaining initial deposit needed
        $remainingInitialDeposit = max(0, $twentyPercentAmount - $totalPaidByAll);
        
        // For the initial deposit payment, the user should pay the remaining deposit amount
        // This is typically the case when the user's required_payment is already set to the 20% deposit
        if ($remainingInitialDeposit > 0) {
            // If the user's required payment is the full 20% deposit, use that amount
            // Otherwise, add the remaining deposit to their base payment
            if ($requiredPayment >= $twentyPercentAmount) {
                $paymentAmount = $remainingInitialDeposit;
            } else {
                $paymentAmount += $remainingInitialDeposit;
            }
        }
    }
    
    if ($paymentAmount <= 0) {
        throw new Exception('No payment amount to process');
    }
    
    // Update user's payment amount
    $newPaymentAmount = $currentPaymentAmount + $paymentAmount;
    $updatePaymentSql = "UPDATE group_members SET payment_amount = ? WHERE group_id = ? AND username = ?";
    $stmt = $conn->prepare($updatePaymentSql);
    $stmt->bind_param("dis", $newPaymentAmount, $groupId, $currentUsername);
    $stmt->execute();
    $stmt->close();
    
    // Update booking's paid amount
    $updateBookingSql = "UPDATE bookings SET Paid = Paid + ? WHERE booking_id = ?";
    $stmt = $conn->prepare($updateBookingSql);
    $stmt->bind_param("di", $paymentAmount, $bookingId);
    $stmt->execute();
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    // Prepare response message
    $message = "Payment of $" . number_format($paymentAmount, 2) . " processed successfully";
    if ($payInitialDeposit) {
        $message .= " (including initial deposit contribution)";
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'payment_amount' => $paymentAmount,
        'total_paid' => $newPaymentAmount,
        'payment_method' => $paymentMethod
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>
