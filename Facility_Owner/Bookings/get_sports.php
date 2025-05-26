<?php
require_once '../../db.php';
header('Content-Type: application/json');

$query = "SELECT sport_name FROM sports WHERE is_Accepted = 1 ORDER BY sport_name ASC";
$result = $conn->query($query);

$sports = [];
while ($row = $result->fetch_assoc()) {
    $sports[] = $row['sport_name'];
}

echo json_encode($sports);
?>