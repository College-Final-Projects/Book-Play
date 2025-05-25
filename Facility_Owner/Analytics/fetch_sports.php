<?php
require_once '../../db.php';
header('Content-Type: application/json');

$sql = "SELECT DISTINCT SportCategory FROM sportfacilities WHERE is_Accepted = 1";
$result = $conn->query($sql);

$sports = [];

while ($row = $result->fetch_assoc()) {
    $sports[] = $row['SportCategory'];
}

echo json_encode($sports);
?>
