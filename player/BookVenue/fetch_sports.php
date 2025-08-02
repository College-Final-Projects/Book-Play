<?php
require_once '../../../db.php';

header('Content-Type: application/json');

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit();
}

$sql = "SELECT sport_name FROM sports WHERE is_Accepted = 1";
$result = $conn->query($sql);

$sports = [];
while ($row = $result->fetch_assoc()) {
    $sports[] = $row['sport_name'];
}

echo json_encode(["success" => true, "sports" => $sports]);

$conn->close();
?>