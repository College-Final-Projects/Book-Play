<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$user_name = $_SESSION['username'];

switch ($action) {
    case 'get_facilities':
        getFacilities($conn, $user_name);
        break;
    
    case 'get_bookings':
        getBookings($conn);
        break;
    
    case 'get_sports':
        getSports($conn, $user_name);
        break;
    
    case 'add_booking':
        addBooking($conn);
        break;
    
    case 'send_message':
        sendMessage($conn);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function getFacilities($conn, $user_name) {
    $query = "
        SELECT 
            sf.facilities_id, 
            sf.place_name, 
            sf.location, 
            sf.image_url, 
            sf.SportCategory,
            ROUND(AVG(r.rating_value), 1) AS avg_rating
        FROM sportfacilities sf
        INNER JOIN bookings b ON sf.facilities_id = b.facilities_id
        LEFT JOIN ratings r ON sf.facilities_id = r.facilities_id AND r.rating_value > 0
        WHERE sf.owner_username = ? AND sf.is_Accepted = 1
        GROUP BY sf.facilities_id
        HAVING COUNT(b.booking_id) > 0
    ";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $user_name);
    $stmt->execute();
    $result = $stmt->get_result();

    $venues = [];

    while ($row = $result->fetch_assoc()) {
        $venues[] = [
            'id' => $row['facilities_id'],
            'name' => $row['place_name'],
            'location' => $row['location'],
            'image' => $row['image_url'],
            'sport' => $row['SportCategory'],
            'rating' => $row['avg_rating'] ? $row['avg_rating'] : 'N/A'
        ];
    }

    echo json_encode(['success' => true, 'venues' => $venues]);
}

function getBookings($conn) {
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
}

function getSports($conn, $user_name) {
    // Only get sports that have actual bookings for this facility owner
    $query = "
        SELECT DISTINCT sf.SportCategory as sport_name 
        FROM sportfacilities sf
        INNER JOIN bookings b ON sf.facilities_id = b.facilities_id
        WHERE sf.owner_username = ? AND sf.is_Accepted = 1
        ORDER BY sf.SportCategory
    ";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $user_name);
    $stmt->execute();
    $result = $stmt->get_result();

    $sports = [];
    while ($row = $result->fetch_assoc()) {
        $sports[] = $row['sport_name'];
    }

    echo json_encode($sports);
}

function addBooking($conn) {
    $username = $_POST['username'] ?? '';
    $date = $_POST['date'] ?? '';
    $players = intval($_POST['players'] ?? 0);
    $start_time = $_POST['start_time'] ?? '';
    $end_time = $_POST['end_time'] ?? '';
    $facilityId = intval($_POST['facility_id'] ?? 0);

    if (!$username || !$date || !$players || !$start_time || !$end_time || !$facilityId) {
        echo json_encode(['success' => false, 'message' => 'Missing fields']);
        exit;
    }

    // Check if user exists
    $userCheck = $conn->prepare("SELECT 1 FROM users WHERE username = ?");
    $userCheck->bind_param("s", $username);
    $userCheck->execute();
    $userCheck->store_result();

    if ($userCheck->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Username not found in database.']);
        exit;
    }

    // Prevent past dates
    if (strtotime($date) < strtotime(date('Y-m-d'))) {
        echo json_encode(['success' => false, 'message' => 'Date must be today or in the future.']);
        exit;
    }

    // Prevent booking in past hours of same day
    if ($date === date('Y-m-d')) {
        $now = date('H:i');
        if (strtotime($end_time) <= strtotime($now)) {
            echo json_encode(['success' => false, 'message' => 'Cannot book for past hours today.']);
            exit;
        }
    }

    // Check for existing booking at same time
    $conflictCheck = $conn->prepare("
        SELECT 1 FROM bookings
        WHERE facilities_id = ? AND booking_date = ? 
        AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
        )
    ");
    $conflictCheck->bind_param("isssssss", $facilityId, $date, $end_time, $end_time, $start_time, $start_time, $start_time, $end_time);
    $conflictCheck->execute();
    $conflictCheck->store_result();

    if ($conflictCheck->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This time slot is already booked.']);
        exit;
    }

    $start = DateTime::createFromFormat('H:i', $start_time);
    $end = DateTime::createFromFormat('H:i', $end_time);
    $duration_hours = ($end->getTimestamp() - $start->getTimestamp()) / 3600;

    // Extract price from database
    $facility_id = $_POST['facility_id'];
    $stmt = $conn->prepare("SELECT price FROM sportfacilities WHERE facilities_id = ?");
    $stmt->bind_param("i", $facility_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $price = $result->fetch_assoc()['price'] ?? 0;

    $total_price = $price * $duration_hours;

    // Save booking
    $stmt = $conn->prepare("
        INSERT INTO bookings (facilities_id, username, booking_date, start_time, end_time, status,Total_Price) 
        VALUES (?, ?, ?, ?, ?, 'pending',?)
    ");
    $stmt->bind_param("issssi", $facilityId, $username, $date, $start_time, $end_time, $total_price);

    if ($stmt->execute()) {
        $bookingId = $conn->insert_id;

        if ($players > 1) {
            $groupName = $username . "'s Group " . date("Ymd_His");
            $description = "Auto-created group for booking on $date at $start_time";
            $maxMembers = $players;

            $groupStmt = $conn->prepare("
                INSERT INTO groups (group_name, facilities_id, description, created_by, max_members, booking_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $groupStmt->bind_param("sissii", $groupName, $facilityId, $description, $username, $maxMembers, $bookingId);

            if ($groupStmt->execute()) {
                $groupId = $conn->insert_id;
                $memberStmt = $conn->prepare("INSERT INTO group_members (group_id, username) VALUES (?, ?)");
                $memberStmt->bind_param("is", $groupId, $username);
                $memberStmt->execute();
            }
        }

        echo json_encode(['success' => true, 'message' => 'Booking and group (if needed) saved!']);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
}

function sendMessage($conn) {
    $sender = $_SESSION['username'] ?? null;
    $receiver = $_POST['receiver_username'] ?? '';
    $message = trim($_POST['message'] ?? '');

    if (!$sender || !$receiver || !$message) {
        echo json_encode(['success' => false, 'message' => 'Missing fields']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO messages (sender_username, receiver_username, message_text) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $sender, $receiver, $message);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Message sent successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send message.']);
    }
}
?>
