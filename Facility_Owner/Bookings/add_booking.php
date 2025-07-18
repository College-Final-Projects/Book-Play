<?php
session_start();
require_once '../../db.php';
header('Content-Type: application/json');

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


// ✅ تحقق من وجود المستخدم
$userCheck = $conn->prepare("SELECT 1 FROM users WHERE username = ?");
$userCheck->bind_param("s", $username);
$userCheck->execute();
$userCheck->store_result();

if ($userCheck->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Username not found in database.']);
    exit;
}

// ✅ منع التاريخ في الماضي
if (strtotime($date) < strtotime(date('Y-m-d'))) {
    echo json_encode(['success' => false, 'message' => 'Date must be today or in the future.']);
    exit;
}

// ✅ منع الحجز في ساعات ماضية من نفس اليوم
if ($date === date('Y-m-d')) {
    $now = date('H:i');
    if (strtotime($end) <= strtotime($now)) {
        echo json_encode(['success' => false, 'message' => 'Cannot book for past hours today.']);
        exit;
    }
}

// ✅ التحقق من وجود حجز في نفس الوقت
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

// استخرج السعر من قاعدة البيانات
$facility_id = $_POST['facility_id'];
$stmt = $conn->prepare("SELECT price FROM sportfacilities WHERE facilities_id = ?");
$stmt->bind_param("i", $facility_id);
$stmt->execute();
$result = $stmt->get_result();
$price = $result->fetch_assoc()['price'] ?? 0;

$total_price = $price * $duration_hours;
// ✅ حفظ الحجز
$stmt = $conn->prepare("
    INSERT INTO bookings (facilities_id, username, booking_date, start_time, end_time, status,Total_Price) 
    VALUES (?, ?, ?, ?, ?, 'pending',?)
");
$stmt->bind_param("issssi", $facilityId, $username, $date, $start_time, $end_time, $total_price);

if ($stmt->execute()) {
    $bookingId = $conn->insert_id; // ✅ هنا صار عندك booking_id

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
?>