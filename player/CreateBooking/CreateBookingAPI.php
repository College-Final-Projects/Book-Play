<?php
session_start();
require_once '../../db.php'; // عدّل المسار إذا كان مختلفًا

header('Content-Type: application/json');

// التحقق من وجود facility_id
$facility_id = $_GET['facility_id'] ?? null;

if (!$facility_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing facility_id"
    ]);
    exit;
}

// جلب بيانات المنشأة من قاعدة البيانات
$stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE facilities_id = ?");
$stmt->bind_param("i", $facility_id);
$stmt->execute();
$result = $stmt->get_result();

if ($facility = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "facility" => $facility
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Facility not found"
    ]);
}
