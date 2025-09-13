<?php
// Disable error display and enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

// Set JSON header immediately
header('Content-Type: application/json');

// Function to safely output JSON and exit
function outputJsonAndExit($data) {
    ob_clean();
    echo json_encode($data);
    exit;
}

// Function to handle errors safely
function handleError($message) {
    error_log("CancelBookingExpired Error: " . $message);
    outputJsonAndExit(['success' => false, 'error' => $message]);
}

try {
    session_start();

    // Handle different path contexts (direct access vs included)
    $db_path = '../../../db.php';
    if (!file_exists($db_path)) {
        $db_path = __DIR__ . '/../../../db.php';
        if (!file_exists($db_path)) {
            $db_path = dirname(dirname(dirname(__DIR__))) . '/db.php';
        }
    }
    
    if (!file_exists($db_path)) {
        handleError('Database configuration file not found');
    }
    
    require_once $db_path;
    
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        handleError('Database connection failed');
    }
    
    // Clear any output that might have been generated
    ob_clean();

    // Debug logging
    error_log("CancelBookingExpired - Session ID: " . session_id());
    error_log("CancelBookingExpired - Session data: " . json_encode($_SESSION));
    error_log("CancelBookingExpired - POST data: " . json_encode($_POST));

    // Check if user is logged in
    $currentUser = $_SESSION['username'] ?? '';
    if (empty($currentUser)) {
        error_log("CancelBookingExpired - User not logged in");
        handleError('User not logged in');
    }

    // Get booking ID from POST data
    $bookingId = $_POST['booking_id'] ?? null;
    if (!$bookingId) {
        error_log("CancelBookingExpired - No booking ID provided");
        handleError('Booking ID is required');
    }

    error_log("CancelBookingExpired - Processing cancellation for user: $currentUser, booking: $bookingId");

    // Start transaction
    $conn->autocommit(false);
    
    // Get booking details
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE booking_id = ?");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    $stmt->close();
    
    if (!$booking) {
        throw new Exception("Booking not found");
    }
    
    // Get group details
    $stmt = $conn->prepare("SELECT * FROM groups WHERE booking_id = ?");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();
    
    if (!$group) {
        throw new Exception("Group not found");
    }
    
    // Get all group members with their payment amounts
    $stmt = $conn->prepare("
        SELECT gm.*, u.email, u.first_name, u.last_name 
        FROM group_members gm 
        JOIN users u ON gm.username = u.username 
        WHERE gm.group_id = ?
    ");
    $stmt->bind_param("i", $group['group_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $members = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Calculate total venue price
    $totalVenuePrice = floatval($booking['total_price']);
    $twentyPercent = $totalVenuePrice * 0.2;
    
    // Calculate refunds for each member
    $refunds = [];
    foreach ($members as $member) {
        $paymentAmount = floatval($member['payment_amount']);
        $isHost = ($member['username'] === $group['created_by']);
        
        if ($isHost) {
            // Host refund = payment_amount - 20% of total venue price
            $refundAmount = max(0, $paymentAmount - $twentyPercent);
        } else {
            // Regular member refund = full payment_amount
            $refundAmount = $paymentAmount;
        }
        
        $refunds[] = [
            'username' => $member['username'],
            'email' => $member['email'],
            'first_name' => $member['first_name'],
            'last_name' => $member['last_name'],
            'payment_amount' => $paymentAmount,
            'refund_amount' => $refundAmount,
            'is_host' => $isHost
        ];
    }
    
    // Send cancellation emails
    $emailErrors = [];
    try {
        require_once '../../../mail/MailLink.php';
        
        foreach ($refunds as $refund) {
            $subject = "Booking Cancelled - Refund Information";
            $message = "
                <h2>Booking Cancellation Notice</h2>
                <p>Dear {$refund['first_name']} {$refund['last_name']},</p>
                
                <p>We regret to inform you that your booking has been cancelled due to insufficient payment within the 24-hour deadline.</p>
                
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Venue:</strong> {$booking['venue_name']}</li>
                    <li><strong>Date:</strong> {$booking['booking_date']}</li>
                    <li><strong>Time:</strong> {$booking['start_time']} - {$booking['end_time']}</li>
                    <li><strong>Total Venue Price:</strong> ₪{$totalVenuePrice}</li>
                </ul>
                
                <h3>Refund Information:</h3>
                <ul>
                    <li><strong>Your Payment:</strong> ₪{$refund['payment_amount']}</li>
                    <li><strong>Your Refund:</strong> ₪{$refund['refund_amount']}</li>
                    " . ($refund['is_host'] ? "<li><strong>Note:</strong> As the host, 20% of the venue price (₪{$twentyPercent}) has been deducted from your refund as per our cancellation policy.</li>" : "") . "
                </ul>
                
                <p>Your refund will be processed within 3-5 business days.</p>
                
                <p>Thank you for using Book-Play.</p>
            ";
            
            $emailSent = sendBookingConfirmationEmail($refund['email'], $subject, $message);
            if (!$emailSent) {
                $emailErrors[] = "Failed to send email to {$refund['email']}";
            }
        }
    } catch (Exception $e) {
        error_log("Email sending error: " . $e->getMessage());
        $emailErrors[] = "Email system error: " . $e->getMessage();
    }
    
    // Delete records in correct order (due to foreign key constraints)
    // 1. Delete group members
    $stmt = $conn->prepare("DELETE FROM group_members WHERE group_id = ?");
    $stmt->bind_param("i", $group['group_id']);
    $stmt->execute();
    $stmt->close();
    
    // 2. Delete group
    $stmt = $conn->prepare("DELETE FROM groups WHERE group_id = ?");
    $stmt->bind_param("i", $group['group_id']);
    $stmt->execute();
    $stmt->close();
    
    // 3. Delete booking
    $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    $conn->autocommit(true);
    
    $response = [
        'success' => true, 
        'message' => 'Booking cancelled successfully',
        'refunds' => $refunds
    ];
    
    if (!empty($emailErrors)) {
        $response['email_warnings'] = $emailErrors;
        $response['message'] .= ' (Some emails may not have been sent)';
    }
    
    outputJsonAndExit($response);
    
} catch (Exception $e) {
    // Rollback transaction if it was started
    if (isset($conn) && $conn->autocommit === false) {
        $conn->rollback();
        $conn->autocommit(true);
    }
    
    error_log("CancelBookingExpired Error: " . $e->getMessage());
    handleError($e->getMessage());
} catch (Error $e) {
    // Handle PHP fatal errors
    error_log("CancelBookingExpired Fatal Error: " . $e->getMessage());
    handleError('Internal server error occurred');
} finally {
    // Clean up output buffer
    if (ob_get_level()) {
        ob_end_clean();
    }
}
?>
