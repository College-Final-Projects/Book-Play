<?php
session_start();
require_once '../../../db.php';
require_once '../../../mail/MailLink.php';
header('Content-Type: application/json');

// Add debugging
error_log("=== CREATEBOOKINGAPI.PHP DEBUG START ===");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Session username: " . ($_SESSION['username'] ?? 'null'));

// Check database connection
if ($conn->connect_error) {
    error_log("❌ Database connection failed: " . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

error_log("✅ Database connection successful");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['username'])) {
        echo json_encode(["success" => false, "message" => "User not logged in"]);
        exit;
    }

    $username = $_SESSION['username'];
    $facility_id = $_POST['facility_id'] ?? null;
    $start_date = $_POST['start_date'] ?? null;
    $start_time = $_POST['start_time'] ?? null;
    $end_time = $_POST['end_time'] ?? null;
    $player_count = (int) ($_POST['player_count'] ?? 0);
    $group_type = $_POST['group_type'] ?? 'public';
    $group_password = trim($_POST['group_password'] ?? '');

    if (!$facility_id || !$start_date || !$start_time || !$end_time) {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit;
    }

    // Get price from sportfacilities table
    $priceQuery = $conn->prepare("SELECT price FROM sportfacilities WHERE facilities_id = ?");
    $priceQuery->bind_param("i", $facility_id);
    $priceQuery->execute();
    $priceResult = $priceQuery->get_result();
    $facility = $priceResult->fetch_assoc();
    $pricePerHour = $facility ? (int)$facility['price'] : 0;

    // Calculate total price
    $start = new DateTime($start_time);
    $end = new DateTime($end_time);
    $interval = $start->diff($end);
    $hours = $interval->h + ($interval->i / 60);
    $total_price = $pricePerHour * $hours;
    $deposit_amount = round($total_price * 0.20, 2);

    // Create booking
    $stmt = $conn->prepare("INSERT INTO bookings (facilities_id, username, booking_date, start_time, end_time, Total_Price, Paid) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssdd", $facility_id, $username, $start_date, $start_time, $end_time, $total_price, $deposit_amount);

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Failed to insert booking"]);
        exit;
    }

    $booking_id = $stmt->insert_id;

    if ($player_count >= 1) {
    $group_name = $username . "'s Group";
    $privacy = $group_type === 'public' ? 'public' : 'private';
    $password_to_save = ($privacy === 'private') ? $group_password : null;

    $group_stmt = $conn->prepare("INSERT INTO `groups` (group_name, facilities_id, created_by, max_members, booking_id, privacy, group_password) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $group_stmt->bind_param("sisiiss", $group_name, $facility_id, $username, $player_count, $booking_id, $privacy, $password_to_save);

    if (!$group_stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Failed to insert group"]);
        exit;
    }

    $group_id = $group_stmt->insert_id;

    // ⬇️ Add user to group with 20% paid and 0 required
    $add_host_stmt = $conn->prepare("INSERT INTO group_members (group_id, username, payment_amount, required_payment) VALUES (?, ?, ?, 0)");
    $add_host_stmt->bind_param("isd", $group_id, $username, $deposit_amount);
    $add_host_stmt->execute();
}


    // Send confirmation email with receipt
    $user_stmt = $conn->prepare("SELECT email, first_name, last_name FROM users WHERE username = ? LIMIT 1");
    $user_stmt->bind_param("s", $username);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    $user = $user_res->fetch_assoc();

    // Facility details for email
    $facility_stmt = $conn->prepare("SELECT place_name, location FROM sportfacilities WHERE facilities_id = ? LIMIT 1");
    $facility_stmt->bind_param("i", $facility_id);
    $facility_stmt->execute();
    $facility_res = $facility_stmt->get_result();
    $facility_row = $facility_res->fetch_assoc();

    $remaining_amount = round($total_price - $deposit_amount, 2);

    if ($user && isset($user['email'])) {
        $full_name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        $venue_name = $facility_row['place_name'] ?? 'Venue';
        $venue_location = $facility_row['location'] ?? '';
        $subject = 'Booking Confirmed - Book&Play #' . $booking_id;
        $message = '<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
            <h2 style="margin:0 0 8px">Thanks for your booking, ' . htmlspecialchars($full_name ?: $username) . '!</h2>
            <p>Your booking has been confirmed. Here are the details:</p>
            <ul style="padding-left:16px">
              <li><strong>Booking ID:</strong> #' . $booking_id . '</li>
              <li><strong>Venue:</strong> ' . htmlspecialchars($venue_name) . ' ' . htmlspecialchars($venue_location) . '</li>
              <li><strong>Date:</strong> ' . htmlspecialchars($start_date) . '</li>
              <li><strong>Time:</strong> ' . htmlspecialchars($start_time) . ' → ' . htmlspecialchars($end_time) . '</li>
            </ul>
            <h3 style="margin:16px 0 8px">Receipt</h3>
            <table style="border-collapse:collapse;width:100%;max-width:480px">
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Total</td><td style="padding:6px 8px;border:1px solid #ddd">₪' . number_format($total_price, 2) . '</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Deposit (20%)</td><td style="padding:6px 8px;border:1px solid #ddd">₪' . number_format($deposit_amount, 2) . '</td></tr>
              <tr><td style="padding:6px 8px;border:1px solid #ddd">Remaining</td><td style="padding:6px 8px;border:1px solid #ddd">₪' . number_format($remaining_amount, 2) . '</td></tr>
            </table>
            <p style="margin-top:12px"><strong>Note:</strong> The 20% deposit is non‑refundable.</p>
            <p style="margin-top:16px">Book&Play Team</p>
        </div>';
        sendBookingConfirmationEmail($user['email'], $subject, $message);
    }

    echo json_encode([
        "success" => true,
        "booking_id" => $booking_id
    ]);

    exit;
}

// ======================= GET =======================

$facility_id = $_GET['facility_id'] ?? null;
$booking_date = $_GET['booking_date'] ?? null;

error_log("GET request - facility_id: " . $facility_id . ", booking_date: " . $booking_date);

if (!$facility_id) {
    error_log("❌ Missing facility_id in GET request");
    echo json_encode(["success" => false, "message" => "Missing facility_id"]);
    exit;
}

if ($booking_date) {
    error_log("Fetching unavailable ranges for date: " . $booking_date);
    $stmt = $conn->prepare("SELECT start_time, end_time FROM bookings WHERE facilities_id = ? AND booking_date = ?");
    $stmt->bind_param("is", $facility_id, $booking_date);
    $stmt->execute();
    $result = $stmt->get_result();

    $unavailable = [];
    while ($row = $result->fetch_assoc()) {
        $unavailable[] = [
            'from' => substr($row['start_time'], 0, 5),
            'to'   => substr($row['end_time'], 0, 5)
        ];
    }

    error_log("✅ Found " . count($unavailable) . " unavailable ranges");
    echo json_encode(["success" => true, "unavailable_ranges" => $unavailable]);
    exit;
}

error_log("Fetching facility details for ID: " . $facility_id);
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ?");
$stmt->bind_param("i", $facility_id);
$stmt->execute();
$result = $stmt->get_result();

if ($facility = $result->fetch_assoc()) {
    error_log("✅ Facility found: " . $facility['place_name']);
    echo json_encode(["success" => true, "facility" => $facility]);
} else {
    error_log("❌ Facility not found for ID: " . $facility_id);
    echo json_encode(["success" => false, "message" => "Facility not found"]);
}

error_log("=== CREATEBOOKINGAPI.PHP DEBUG END ===");
?>
