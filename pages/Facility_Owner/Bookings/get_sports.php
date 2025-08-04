<?php
require_once '../../../db.php';
header('Content-Type: application/json');

$query = "SELECT DISTINCT SportCategory as sport_name FROM sportfacilities WHERE is_Accepted = 1";
$result = $conn->query($query);

$sports = [];
while ($row = $result->fetch_assoc()) {
    $sports[] = $row['sport_name'];
}

echo json_encode($sports);
?>