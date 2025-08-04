<?php
require_once 'db.php';

echo "<h2>Creating Missing Tables</h2>";

// Create user_favorite_facilities table
$sql = "
CREATE TABLE IF NOT EXISTS `user_favorite_facilities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `facility_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`facility_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;
";

if ($conn->query($sql) === TRUE) {
    echo "✅ user_favorite_facilities table created successfully<br>";
} else {
    echo "❌ Error creating user_favorite_facilities table: " . $conn->error . "<br>";
}

// Check if other tables exist
$tables = ['users', 'sportfacilities', 'sports', 'ratings'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows > 0) {
        echo "✅ $table table exists<br>";
    } else {
        echo "❌ $table table missing<br>";
    }
}

echo "<br><h3>Testing venue fetch:</h3>";
// Test the venue fetch
$test_sql = "SELECT COUNT(*) as count FROM sportfacilities WHERE is_Accepted = 1";
$result = $conn->query($test_sql);
if ($result) {
    $row = $result->fetch_assoc();
    echo "Found " . $row['count'] . " accepted venues<br>";
} else {
    echo "Error checking venues: " . $conn->error . "<br>";
}

$conn->close();
?> 