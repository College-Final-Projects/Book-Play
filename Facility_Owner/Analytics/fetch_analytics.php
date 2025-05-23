<?php 
session_start(); 
require_once '../../db.php'; 

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

header('Content-Type: application/json'); 
 
$venueName = $_GET['venue'] ?? null; 
$year = $_GET['year'] ?? date("Y"); 
 
if (!$venueName || trim($venueName) === '') { 
    echo json_encode(['error' => 'Missing venue parameter', 'debug' => $_GET]); 
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
        MONTHNAME(booking_date) AS month_name,
        COUNT(*) AS total_bookings, 
        SUM(f.price) AS total_revenue 
    FROM bookings b 
    JOIN facilities f ON b.facilities_id = f.facilities_id 
    WHERE b.facilities_id = ? 
      AND YEAR(booking_date) = ? 
      AND b.status = 'confirmed'
    GROUP BY MONTH(booking_date), MONTHNAME(booking_date)
    ORDER BY MONTH(booking_date)
"; 
 
$stmt = $conn->prepare($sql); 
$stmt->bind_param("ii", $facilityId, $year); 
$stmt->execute(); 
$result = $stmt->get_result(); 
 
$monthlyData = []; 
while ($row = $result->fetch_assoc()) { 
    $monthNumber = (int)$row['month']; 
    $monthName = $row['month_name']; 
    $monthlyData[$monthName][] = [ 
        'date' => $monthName, 
        'bookings' => (int)$row['total_bookings'], 
        'total' => (float)$row['total_revenue'] 
    ]; 
} 

// Close statements
$stmtFacility->close();
$stmt->close();

echo json_encode($monthlyData);
?>