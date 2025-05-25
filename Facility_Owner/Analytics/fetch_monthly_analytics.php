<?php
session_start();
require_once '../../db.php';
header('Content-Type: application/json');

$venueName = $_GET['venue'] ?? null;
$year = $_GET['year'] ?? date("Y");

if (!$venueName) {
    echo json_encode(["error" => "Missing venue"]);
    exit;
}

// تعديل اسم الجدول حسب قاعدة البيانات الفعلية
$sqlFacilityId = "SELECT facilities_id FROM sportfacilities WHERE place_name = ? LIMIT 1";
$stmtFacility = $conn->prepare($sqlFacilityId);

if (!$stmtFacility) {
    echo json_encode([
        "error" => "Prepare failed for facility ID query",
        "sqlError" => $conn->error
    ]);
    exit;
}

$stmtFacility->bind_param("s", $venueName);
$stmtFacility->execute();
$resultFacility = $stmtFacility->get_result();
$rowFacility = $resultFacility->fetch_assoc();

if (!$rowFacility) {
    echo json_encode([]);
    exit;
}

$facilityId = $rowFacility['facilities_id'];

// جلب عدد الحجوزات وإجمالي الأرباح لكل يوم في كل شهر
$sql = "
    SELECT 
        MONTH(booking_date) AS month,
        DAY(booking_date) AS day,
        COUNT(*) AS total_bookings,
        SUM(f.price) AS total_revenue
    FROM bookings b
    JOIN sportfacilities f ON b.facilities_id = f.facilities_id
    WHERE b.facilities_id = ?
      AND YEAR(booking_date) = ?
    GROUP BY MONTH(booking_date), DAY(booking_date)
    ORDER BY MONTH(booking_date), DAY(booking_date)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "error" => "Prepare failed for analytics query",
        "sqlError" => $conn->error
    ]);
    exit;
}

$stmt->bind_param("ii", $facilityId, $year);
$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $monthNumber = (int)$row['month'];
    $monthName = date('F', mktime(0, 0, 0, $monthNumber, 10));
    $day = (int)$row['day'];
    $data[$monthName][] = [
        'date' => "$monthName $day",
        'bookings' => (int)$row['total_bookings'],
        'total' => (float)$row['total_revenue']
    ];
}

echo json_encode($data);
