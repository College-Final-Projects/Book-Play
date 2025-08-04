<?php
session_start();
require_once '../../../db.php';

echo "<h2>Database Reports Test</h2>";

// Check all reports
$sql = "SELECT * FROM reports ORDER BY created_at DESC";
$result = $conn->query($sql);

echo "<h3>All Reports in Database:</h3>";
if ($result && $result->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Username</th><th>Type</th><th>Facility ID</th><th>Reason</th><th>Created</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['report_id'] . "</td>";
        echo "<td>" . $row['username'] . "</td>";
        echo "<td>" . $row['type'] . "</td>";
        echo "<td>" . $row['facilities_id'] . "</td>";
        echo "<td>" . $row['Reason'] . "</td>";
        echo "<td>" . $row['created_at'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>No reports found in database.</p>";
}

// Check specifically for report_place type
echo "<h3>Venue Reports (type = 'report_place'):</h3>";
$sql2 = "SELECT * FROM reports WHERE type = 'report_place' ORDER BY created_at DESC";
$result2 = $conn->query($sql2);

if ($result2 && $result2->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Username</th><th>Type</th><th>Facility ID</th><th>Reason</th><th>Created</th></tr>";
    while ($row = $result2->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['report_id'] . "</td>";
        echo "<td>" . $row['username'] . "</td>";
        echo "<td>" . $row['type'] . "</td>";
        echo "<td>" . $row['facilities_id'] . "</td>";
        echo "<td>" . $row['Reason'] . "</td>";
        echo "<td>" . $row['created_at'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>No venue reports found.</p>";
}

// Check table structure
echo "<h3>Reports Table Structure:</h3>";
$sql3 = "DESCRIBE reports";
$result3 = $conn->query($sql3);

if ($result3) {
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $result3->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['Field'] . "</td>";
        echo "<td>" . $row['Type'] . "</td>";
        echo "<td>" . $row['Null'] . "</td>";
        echo "<td>" . $row['Key'] . "</td>";
        echo "<td>" . $row['Default'] . "</td>";
        echo "<td>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}
?> 