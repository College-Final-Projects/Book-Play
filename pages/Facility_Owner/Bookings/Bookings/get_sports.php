<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$user_name = $_SESSION['username'];

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
?>