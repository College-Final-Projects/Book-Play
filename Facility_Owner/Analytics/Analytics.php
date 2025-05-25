<?php 
session_start(); 
require_once '../../db.php'; 

 
$venueName = $_GET['venue'] ?? null; 
$year = $_GET['year'] ?? date("Y"); 
 
if (!$venueName) { 
    echo json_encode(['error' => 'Missing venue parameter']); 
    exit; 
} 

// Validate year parameter
if (!is_numeric($year) || $year < 1900 || $year > 2100) {
    echo json_encode(['error' => 'Invalid year parameter']);
    exit;
}
 
// Get facility ID and verify ownership
$sqlFacilityId = "SELECT facilities_id FROM facilities WHERE place_name = ? AND owner_username = ? LIMIT 1"; 
$stmtFacility = $conn->prepare($sqlFacilityId); 
$stmtFacility->bind_param("ss", $venueName, $_SESSION['username']); 
$stmtFacility->execute(); 
$resultFacility = $stmtFacility->get_result(); 
$rowFacility = $resultFacility->fetch_assoc(); 
 
if (!$rowFacility) { 
    echo json_encode(['error' => 'Venue not found or access denied']); 
    exit; 
} 
 
$facilityId = $rowFacility['facilities_id']; 
 
$sql = " 
    SELECT  
        MONTH(booking_date) AS month, 
        COUNT(*) AS total_bookings, 
        SUM(f.price) AS total_revenue 
    FROM bookings b 
    JOIN facilities f ON b.facilities_id = f.facilities_id 
    WHERE b.facilities_id = ? 
      AND YEAR(booking_date) = ? 
      AND b.status = 'confirmed'
    GROUP BY MONTH(booking_date) 
    ORDER BY MONTH(booking_date)
"; 
 
$stmt = $conn->prepare($sql); 
$stmt->bind_param("ii", $facilityId, $year); 
$stmt->execute(); 
$result = $stmt->get_result(); 
 
$data = []; 
while ($row = $result->fetch_assoc()) { 
    $monthNumber = (int)$row['month']; 
    $monthName = date('F', mktime(0, 0, 0, $monthNumber, 10)); 
    $data[] = [ 
        'month' => $monthName,
        'monthNumber' => $monthNumber, 
        'bookings' => (int)$row['total_bookings'], 
        'revenue' => (float)$row['total_revenue'] 
    ]; 
} 

// Close statements
$stmtFacility->close();
$stmt->close();
 
// Check if this is an AJAX request
if (isset($_GET['ajax']) && $_GET['ajax'] === 'true') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'venue' => $venueName,
        'year' => (int)$year,
        'data' => $data
    ]); 
    exit;
}

// If not AJAX, make data available to HTML and include it
$analyticsData = [
    'success' => true,
    'venue' => $venueName,
    'year' => (int)$year,
    'data' => $data
];

include 'Analytics.html';
 
?>