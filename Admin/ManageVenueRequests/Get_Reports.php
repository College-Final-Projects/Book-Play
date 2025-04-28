<?php
require_once '../../db.php';
header('Content-Type: application/json');

$sql = "SELECT * FROM reports WHERE type = 'suggest_place' ORDER BY created_at DESC";
$result = $conn->query($sql);

$reports = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
}

echo json_encode($reports);
$conn->close();
?>