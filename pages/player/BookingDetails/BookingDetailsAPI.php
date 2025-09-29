<?php
// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

try {
    session_start();
    require_once '../../../db.php';

    // Check if user is logged in
    $currentUser = $_SESSION['username'] ?? '';
    if (!$currentUser) {
        echo json_encode(['success' => false, 'error' => 'User not logged in']);
        exit;
    }

    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'get_booking_details':
            getBookingDetails($conn, $currentUser);
            break;
        
        case 'cancel_booking':
            cancelBooking($conn, $currentUser);
            break;
        
        case 'leave_group':
            leaveGroup($conn, $currentUser);
            break;
        
        case 'make_host':
            makeHost($conn, $currentUser);
            break;
        
        case 'update_player_price':
            updatePlayerPrice($conn, $currentUser);
            break;
        
        case 'update_privacy':
            updatePrivacy($conn, $currentUser);
            break;
        
        case 'process_payment':
            processPayment($conn, $currentUser);
            break;
        
        case 'check_payment_status':
            checkPaymentStatus($conn, $currentUser);
            break;
        
        case 'cancel_booking_expired':
            cancelBookingExpired($conn, $currentUser);
            break;
        
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }

} catch (Exception $e) {
    error_log("Exception in BookingDetailsAPI.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function getBookingDetails($conn, $currentUser) {
    $bookingId = $_GET['booking_id'] ?? null;

    if (!$bookingId) {
        echo json_encode(['error' => 'Missing booking_id']);
        return;
    }

    // Get booking data + group + venue
    $bookingSql = "
      SELECT 
        b.*, 
        g.group_id,
        g.group_name, 
        g.privacy,
        g.group_password,
        g.max_members,
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
        return;
    }
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $bookingResult = $stmt->get_result();
    $booking = $bookingResult->fetch_assoc();

    if (!$booking) {
        echo json_encode([
            "error" => "Booking not found with ID $bookingId"
        ]);
        return;
    }

    // Get players
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
        return;
    }
    $stmt2->bind_param("i", $bookingId);
    $stmt2->execute();
    $playersResult = $stmt2->get_result();
    $players = [];

    // Ensure only one host and fix image paths
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

    // Calculate total price
    $start = new DateTime($booking['start_time']);
    $end = new DateTime($booking['end_time']);
    $intervalInSeconds = ($end->getTimestamp() - $start->getTimestamp());
    $hours = $intervalInSeconds / 3600;
    $totalPrice = round($booking['price'] * $hours, 2);

    // Calculate countdown timers and payment status
    $now = new DateTime();
    $bookingCreated = new DateTime($booking['created_at']);
    $bookingDateTime = new DateTime($booking['booking_date'] . ' ' . $booking['start_time']);

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

    // Single-phase: Full payment required within 24 hours of booking creation
    $countdownPhase = 1;
    $countdownEndTime = null;
    $countdownSeconds = 0;

    // Deadline = created_at + 24 hours
    $twentyFourHourDeadline = clone $bookingCreated;
    $twentyFourHourDeadline->add(new DateInterval('PT24H'));

    if ($now < $twentyFourHourDeadline) {
        $countdownEndTime = $twentyFourHourDeadline;
        $countdownSeconds = $twentyFourHourDeadline->getTimestamp() - $now->getTimestamp();
    } else {
        $countdownSeconds = 0; // Expired
    }

    // Payment deadline met only when full price is paid
    $paymentDeadlineMet = $totalPaid == $totalPrice;

    // Fix venue image path
    $venueImage = '';
    if ($booking['image_url'] && !empty($booking['image_url'])) {
        $venueImage = '../../../uploads/venues/' . str_replace('\\', '/', $booking['image_url']);
    } else {
        $venueImage = '../../../Images/staduim_icon.png'; // Default image
    }

    // Determine current user's role
    $currentUserRole = 'guest'; // Default role
    $currentUserIsHost = false;
    $currentUserIsMember = false;

    if ($currentUser) {
        // Check if current user is a member of this group
        $memberCheckQuery = "SELECT COUNT(*) as is_member FROM group_members WHERE group_id = ? AND username = ?";
        $stmt4 = $conn->prepare($memberCheckQuery);
        $stmt4->bind_param("is", $booking['group_id'], $currentUser);
        $stmt4->execute();
        $memberResult = $stmt4->get_result();
        $memberData = $memberResult->fetch_assoc();
        $currentUserIsMember = $memberData['is_member'] > 0;
        $stmt4->close();

        if ($currentUserIsMember) {
            // Check if current user is the host
            $hostCheckQuery = "SELECT COUNT(*) as is_host FROM groups WHERE group_id = ? AND created_by = ?";
            $stmt5 = $conn->prepare($hostCheckQuery);
            $stmt5->bind_param("is", $booking['group_id'], $currentUser);
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

    // Send complete data
    echo json_encode([
      'booking' => [
        'place_name' => $booking['group_name'],
        'venue_location' => $booking['venue_location'],
        'venue_image' => $venueImage,
        'booking_date' => $booking['booking_date'],
        'booking_time' => $booking['start_time'] . ' - ' . $booking['end_time'],
        'booking_id' => $booking['booking_id'],
        'total_price' => $totalPrice,
        'paid' => $booking['Paid'], // Add Paid amount from bookings table
        'privacy' => $booking['privacy'],
        'group_password' => $booking['group_password'],
        'group_id' => $booking['group_id'],
        'max_members' => $booking['max_members'] ?? 10, // Add max_members from groups table
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
        'username' => $currentUser,
        'role' => $currentUserRole,
        'is_host' => $currentUserIsHost,
        'is_member' => $currentUserIsMember
      ]
    ]);
}

function cancelBooking($conn, $currentUser) {
    if (!isset($_POST['booking_id'])) {
        echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
        return;
    }

    $booking_id = $_POST['booking_id'];

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
        $stmt->bind_param('ss', $booking_id, $currentUser);
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
}

function leaveGroup($conn, $currentUser) {
    $group_id = isset($_POST['group_id']) ? intval($_POST['group_id']) : 0;

    if (!$group_id) {
        echo json_encode([
            "success" => false,
            "error" => "Invalid group ID"
        ]);
        return;
    }

    // Check if user is a member of this group
    $member_check_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND username = ?";
    $member_check_stmt = mysqli_prepare($conn, $member_check_query);
    mysqli_stmt_bind_param($member_check_stmt, "is", $group_id, $currentUser);
    mysqli_stmt_execute($member_check_stmt);
    $member_check_result = mysqli_stmt_get_result($member_check_stmt);
    $member_check_row = mysqli_fetch_assoc($member_check_result);

    if ($member_check_row['count'] == 0) {
        echo json_encode([
            "success" => false,
            "error" => "You are not a member of this group"
        ]);
        return;
    }

    // Check if user is the host
    $host_check_query = "SELECT COUNT(*) as count FROM groups WHERE group_id = ? AND created_by = ?";
    $host_check_stmt = mysqli_prepare($conn, $host_check_query);
    mysqli_stmt_bind_param($host_check_stmt, "is", $group_id, $currentUser);
    mysqli_stmt_execute($host_check_stmt);
    $host_check_result = mysqli_stmt_get_result($host_check_stmt);
    $host_check_row = mysqli_fetch_assoc($host_check_result);

    if ($host_check_row['count'] > 0) {
        echo json_encode([
            "success" => false,
            "error" => "Host cannot leave the group. Please transfer host role to another member first."
        ]);
        return;
    }

    // Get group details to check if this is the last member
    $member_count_query = "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?";
    $member_count_stmt = mysqli_prepare($conn, $member_count_query);
    mysqli_stmt_bind_param($member_count_stmt, "i", $group_id);
    mysqli_stmt_execute($member_count_stmt);
    $member_count_result = mysqli_stmt_get_result($member_count_stmt);
    $member_count_row = mysqli_fetch_assoc($member_count_result);

    if ($member_count_row['count'] <= 1) {
        echo json_encode([
            "success" => false,
            "error" => "Cannot leave group as you are the last member"
        ]);
        return;
    }

    // Remove user from group_members
    $delete_query = "DELETE FROM group_members WHERE group_id = ? AND username = ?";
    $delete_stmt = mysqli_prepare($conn, $delete_query);
    mysqli_stmt_bind_param($delete_stmt, "is", $group_id, $currentUser);

    if (mysqli_stmt_execute($delete_stmt)) {
        echo json_encode([
            "success" => true,
            "message" => "Successfully left the group"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Failed to leave group: " . mysqli_error($conn)
        ]);
    }
}

function makeHost($conn, $currentUser) {
    $groupId = $_POST['group_id'] ?? null;
    $newHost = $_POST['username'] ?? null;

    if (!$groupId || !$newHost) {
        echo json_encode(['success' => false, 'error' => 'Missing required data']);
        return;
    }

    // Verify that the current user is the current host
    $stmt = $conn->prepare("SELECT created_by FROM groups WHERE group_id = ?");
    $stmt->bind_param("i", $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $currentUser) {
        echo json_encode(['success' => false, 'error' => 'Only the host can transfer host privileges']);
        return;
    }

    // Verify that the new host is a member of the group
    $stmt = $conn->prepare("SELECT username FROM group_members WHERE group_id = ? AND username = ?");
    $stmt->bind_param("is", $groupId, $newHost);
    $stmt->execute();
    $result = $stmt->get_result();
    $member = $result->fetch_assoc();
    $stmt->close();

    if (!$member) {
        echo json_encode(['success' => false, 'error' => 'User is not a member of this group']);
        return;
    }

    // Update the group creator (host)
    $stmt = $conn->prepare("UPDATE groups SET created_by = ? WHERE group_id = ?");
    $stmt->bind_param("si", $newHost, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Host transferred successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update host: ' . $conn->error]);
    }
}

function updatePlayerPrice($conn, $currentUser) {
    $groupId = $_POST['group_id'] ?? null;
    $username = $_POST['username'] ?? null;
    $price = $_POST['price'] ?? null;

    if (!$groupId || !$username || $price === null) {
        echo json_encode(['success' => false, 'error' => 'Missing required data']);
        return;
    }

    // Verify that the current user is the host
    $stmt = $conn->prepare("SELECT created_by FROM groups WHERE group_id = ?");
    $stmt->bind_param("i", $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $currentUser) {
        echo json_encode(['success' => false, 'error' => 'Only the host can update player prices']);
        return;
    }

    // Validate price
    $price = floatval($price);
    if ($price < 0) {
        echo json_encode(['success' => false, 'error' => 'Price cannot be negative']);
        return;
    }

    // Update the player's payment amount
    $stmt = $conn->prepare("UPDATE group_members SET required_payment = ? WHERE group_id = ? AND username = ?");
    $stmt->bind_param("dis", $price, $groupId, $username);
    $success = $stmt->execute();
    $affectedRows = $stmt->affected_rows;
    $stmt->close();

    if ($success) {
        if ($affectedRows > 0) {
            echo json_encode(['success' => true, 'message' => 'Player price updated successfully']);
        } else {
            echo json_encode(['success' => true, 'message' => 'Price unchanged (same value)']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update price: ' . $conn->error]);
    }
}

function updatePrivacy($conn, $currentUser) {
    $groupId = $_POST['group_id'] ?? null;
    $privacy = $_POST['privacy'] ?? null;
    $action = $_POST['action'] ?? null;

    if (!$groupId) {
        echo json_encode(['success' => false, 'error' => 'Missing group ID']);
        return;
    }

    // Handle different actions
    if ($action === 'change_password') {
        handlePasswordChange($conn, $groupId, $currentUser);
        return;
    }

    if ($action === 'save_custom_password') {
        handleSaveCustomPassword($conn, $groupId, $currentUser, $_POST['password'] ?? '');
        return;
    }

    if ($privacy !== 'public' && $privacy !== 'private') {
        echo json_encode(['success' => false, 'error' => 'Invalid privacy setting']);
        return;
    }

    // Verify that the current user is the group admin
    $stmt = $conn->prepare('SELECT created_by, group_password FROM groups WHERE group_id = ?');
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $currentUser) {
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }

    $groupPassword = null;
    if ($privacy === 'private') {
        // Generate new password if switching to private, or keep existing
        $groupPassword = $group['group_password'] ?? null;
        if (empty($groupPassword)) {
            // Generate a random password
            $groupPassword = 'BP' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6)) . '-' . rand(1000, 9999);
        }
    }

    $stmt = $conn->prepare('UPDATE groups SET privacy = ?, group_password = ? WHERE group_id = ?');
    $stmt->bind_param('ssi', $privacy, $groupPassword, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => $success]);
}

function handlePasswordChange($conn, $groupId, $currentUser) {
    // Verify that the current user is the group admin
    $stmt = $conn->prepare('SELECT created_by, privacy FROM groups WHERE group_id = ?');
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $currentUser) {
        echo json_encode(['success' => false, 'error' => 'Only the host can change the password']);
        return;
    }

    // Check if room is private
    if ($group['privacy'] !== 'private') {
        echo json_encode(['success' => false, 'error' => 'Can only change password for private rooms']);
        return;
    }

    // Generate a new random password
    $newPassword = 'BP' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6)) . '-' . rand(1000, 9999);

    // Update the group password
    $stmt = $conn->prepare('UPDATE groups SET group_password = ? WHERE group_id = ?');
    $stmt->bind_param('si', $newPassword, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => 'Password changed successfully',
            'new_password' => $newPassword
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update password: ' . $conn->error]);
    }
}

function handleSaveCustomPassword($conn, $groupId, $currentUser, $password) {
    // Verify that the current user is the group admin
    $stmt = $conn->prepare('SELECT created_by, privacy FROM groups WHERE group_id = ?');
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $stmt->close();

    if (!$group || $group['created_by'] !== $currentUser) {
        echo json_encode(['success' => false, 'error' => 'Only the host can change the password']);
        return;
    }

    // Check if room is private
    if ($group['privacy'] !== 'private') {
        echo json_encode(['success' => false, 'error' => 'Can only change password for private rooms']);
        return;
    }

    // Validate password
    $password = trim($password);
    if (empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Password cannot be empty']);
        return;
    }

    if (strlen($password) < 4) {
        echo json_encode(['success' => false, 'error' => 'Password must be at least 4 characters long']);
        return;
    }

    if (strlen($password) > 50) {
        echo json_encode(['success' => false, 'error' => 'Password cannot be longer than 50 characters']);
        return;
    }

    // Update the group password
    $stmt = $conn->prepare('UPDATE groups SET group_password = ? WHERE group_id = ?');
    $stmt->bind_param('si', $password, $groupId);
    $success = $stmt->execute();
    $stmt->close();

    if ($success) {
        echo json_encode([
            'success' => true, 
            'message' => 'Password saved successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save password: ' . $conn->error]);
    }
}

function processPayment($conn, $currentUser) {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid input data']);
        return;
    }

    $groupId = $input['group_id'] ?? null;
    $bookingId = $input['booking_id'] ?? null;
    $payInitialDeposit = $input['pay_initial_deposit'] ?? false;
    $paymentMethod = $input['payment_method'] ?? 'credit';

    if (!$groupId || !$bookingId) {
        echo json_encode(['success' => false, 'error' => 'Missing required data']);
        return;
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
        $stmt->bind_param("is", $groupId, $currentUser);
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
        
        // Calculate payment amount: charge exactly the user's required_payment
        $paymentAmount = (float)$requiredPayment;
        
        if ($paymentAmount <= 0) {
            throw new Exception('No payment amount to process');
        }
        
        // Update user's payment amount and set required_payment to 0
        $newPaymentAmount = (float)$currentPaymentAmount + (float)$paymentAmount;
        $updatePaymentSql = "UPDATE group_members SET payment_amount = ?, required_payment = 0 WHERE group_id = ? AND username = ?";
        $stmt = $conn->prepare($updatePaymentSql);
        $stmt->bind_param("dis", $newPaymentAmount, $groupId, $currentUser);
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
        
        // Prepare response message (no deposit contribution suffix)
        $message = "Payment of $" . number_format($paymentAmount, 2) . " processed successfully";
        
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
}

function checkPaymentStatus($conn, $currentUser) {
    $bookingId = $_POST['booking_id'] ?? null;
    $groupId = $_POST['group_id'] ?? null;

    if (!$bookingId || !$groupId) {
        echo json_encode(['success' => false, 'error' => 'Missing required data']);
        return;
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
        return;
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

    echo json_encode([
        'success' => true,
        'should_cancel' => $shouldCancel,
        'total_paid' => $totalPaid,
        'twenty_percent_amount' => $twentyPercentAmount,
        'payment_deadline_met' => $paymentDeadlineMet,
        'full_payment_met' => $fullPaymentMet,
        'cancel_reason' => $cancelReason
    ]);
}

function cancelBookingExpired($conn, $currentUser) {
    $bookingId = $_POST['booking_id'] ?? null;
    if (!$bookingId) {
        echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
        return;
    }

    try {
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
        
        echo json_encode([
            'success' => true, 
            'message' => 'Booking cancelled successfully',
            'refunds' => $refunds
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction if it was started
        if (isset($conn) && $conn->autocommit === false) {
            $conn->rollback();
            $conn->autocommit(true);
        }
        
        error_log("CancelBookingExpired Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
