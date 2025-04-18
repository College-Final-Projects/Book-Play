<?php
require_once '../db.php';

$result = $conn->query("SELECT sport_name FROM sports");

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $sport = htmlspecialchars($row['sport_name']);
        echo "<option value=\"$sport\">$sport</option>";
    }
} else {
    echo "<option disabled>No sports available</option>";
}

$conn->close();
?>
