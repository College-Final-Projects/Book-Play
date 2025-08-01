<?php
session_start();
require_once '../../../db.php';

echo "VenueDetails test page<br>";
echo "Available facilities for testing:<br>";

// Get some facilities for testing
$stmt = $conn->prepare("SELECT facilities_id, place_name FROM sportfacilities LIMIT 5");
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    echo "- <a href='VenueDetails.php?facility_id=" . $row['facilities_id'] . "'>" . $row['place_name'] . "</a> (ID: " . $row['facilities_id'] . ")<br>";
}

echo "<br><strong>Test the VenueDetails page with any of the above links!</strong>";
?> 