<?php
require_once '../../../db.php';
require_once '../../../mail/MailLink.php';

header('Content-Type: application/json');
session_start();

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

// Check if booking_id is provided
if (!isset($_POST['booking_id'])) {
    echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
    exit();
}

$booking_id = $_POST['booking_id'];
$current_user = $_SESSION['username'];

try {
    // Start transaction
    $conn->begin_transaction();

    // First, get booking details and verify the user is the host
    $booking_query = "
        SELECT b.*, g.group_id, g.group_name, g.created_by
        FROM bookings b
        LEFT JOIN groups g ON b.booking_id = g.booking_id
        WHERE b.booking_id = ? AND g.created_by = ?
    ";
    
    $stmt = $conn->prepare($booking_query);
    $stmt->bind_param('ss', $booking_id, $current_user);
    $stmt->execute();
    $booking_result = $stmt->get_result();
    
    if ($booking_result->num_rows === 0) {
        throw new Exception('Booking not found or you are not the host of this booking');
    }
    
    $booking = $booking_result->fetch_assoc();
    $group_id = $booking['group_id'];
    
    // Get all group members for email notifications
    $members_query = "
        SELECT gm.username, gm.payment_amount, u.email as user_email
        FROM group_members gm
        LEFT JOIN users u ON gm.username = u.username
        WHERE gm.group_id = ?
    ";
    
    $stmt = $conn->prepare($members_query);
    $stmt->bind_param('s', $group_id);
    $stmt->execute();
    $members_result = $stmt->get_result();
    $group_members = [];
    
    while ($member = $members_result->fetch_assoc()) {
        $group_members[] = $member;
    }
    
    // Get venue details for email
    $venue_query = "SELECT place_name, location FROM sportfacilities WHERE facilities_id = ?";
    $stmt = $conn->prepare($venue_query);
    $stmt->bind_param('s', $booking['facilities_id']);
    $stmt->execute();
    $venue_result = $stmt->get_result();
    $venue = $venue_result->fetch_assoc();
    
    // Delete group_members records
    $delete_members_query = "DELETE FROM group_members WHERE group_id = ?";
    $stmt = $conn->prepare($delete_members_query);
    $stmt->bind_param('s', $group_id);
    $stmt->execute();
    
    // Delete group record
    $delete_group_query = "DELETE FROM groups WHERE group_id = ?";
    $stmt = $conn->prepare($delete_group_query);
    $stmt->bind_param('s', $group_id);
    $stmt->execute();
    
    // Delete booking record
    $delete_booking_query = "DELETE FROM bookings WHERE booking_id = ?";
    $stmt = $conn->prepare($delete_booking_query);
    $stmt->bind_param('s', $booking_id);
    $stmt->execute();
    
    // Commit transaction
    $conn->commit();
    
    // Send email notifications to all group members
    foreach ($group_members as $member) {
        $email = $member['user_email'];
        $amount_paid = $member['payment_amount'] ?: 0;
        
        if ($email) {
            $subject = "Booking Cancelled - Refund Information";
            
            $message = "
            <html>
            <body>
                <h2>Booking Cancelled</h2>
                <p>Dear {$member['username']},</p>
                
                <p>The booking for <strong>{$venue['place_name']}</strong> at {$venue['location']} has been cancelled by the host.</p>
                
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Date:</strong> " . date('F j, Y', strtotime($booking['booking_date'])) . "</li>
                    <li><strong>Time:</strong> {$booking['start_time']} - {$booking['end_time']}</li>
                    <li><strong>Venue:</strong> {$venue['place_name']}</li>
                    <li><strong>Location:</strong> {$venue['location']}</li>
                </ul>
                
                <h3>Refund Information:</h3>
                <p>You will receive a refund of <strong>₪{$amount_paid}</strong> for your payment.</p>
                <p>The refund will be processed within 3-5 business days to your original payment method.</p>
                
                <p>If you have any questions about the refund, please contact our support team.</p>
                
                <p>Thank you for using Book&Play!</p>
                
                <p>Best regards,<br>
                The Book&Play Team</p>
            </body>
            </html>
            ";
            
            try {
                if (sendCancellationEmail($email, $subject, $message)) {
                    error_log("Cancellation email sent successfully to: {$email}");
                } else {
                    error_log("Failed to send cancellation email to: {$email}");
                }
            } catch (Exception $e) {
                error_log("Exception sending cancellation email to {$email}: " . $e->getMessage());
            }
        }
    }
    
    // Send confirmation email to host
    $host_email_query = "SELECT email FROM users WHERE username = ?";
    $stmt = $conn->prepare($host_email_query);
    $stmt->bind_param('s', $current_user);
    $stmt->execute();
    $host_result = $stmt->get_result();
    $host_data = $host_result->fetch_assoc();
    
    if ($host_data && $host_data['email']) {
        $host_subject = "Booking Cancellation Confirmed";
        $host_message = "
        <html>
        <body>
            <h2>Booking Cancellation Confirmed</h2>
            <p>Dear {$current_user},</p>
            
            <p>Your booking cancellation has been successfully processed.</p>
            
            <h3>Cancelled Booking Details:</h3>
            <ul>
                <li><strong>Date:</strong> " . date('F j, Y', strtotime($booking['booking_date'])) . "</li>
                <li><strong>Time:</strong> {$booking['start_time']} - {$booking['end_time']}</li>
                <li><strong>Venue:</strong> {$venue['place_name']}</li>
                <li><strong>Location:</strong> {$venue['location']}</li>
                <li><strong>Group Members:</strong> " . count($group_members) . " players</li>
            </ul>
            
            <p>All group members have been notified and will receive refunds for their payments.</p>
            
            <p>Thank you for using Book&Play!</p>
            
            <p>Best regards,<br>
            The Book&Play Team</p>
        </body>
        </html>
        ";
        
        try {
            if (sendCancellationEmail($host_data['email'], $host_subject, $host_message)) {
                error_log("Cancellation confirmation email sent to host: {$host_data['email']}");
            } else {
                error_log("Failed to send cancellation confirmation email to host: {$host_data['email']}");
            }
        } catch (Exception $e) {
            error_log("Exception sending cancellation confirmation email to host: " . $e->getMessage());
        }
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Booking cancelled successfully. All group members have been notified and will receive refunds.',
        'cancelled_booking' => [
            'booking_id' => $booking_id,
            'venue_name' => $venue['place_name'],
            'members_notified' => count($group_members)
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    if ($conn->connect_errno === 0) {
        $conn->rollback();
    }
    
    error_log("Booking cancellation error: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to cancel booking: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
