<?php
session_start();
require_once '../../../db.php';

echo "<h2>Login Test Page</h2>";

// Check if user is logged in
if (isset($_SESSION['user_id'])) {
    echo "<p><strong>Current user:</strong> {$_SESSION['user_id']}</p>";
    echo "<p><strong>Role:</strong> {$_SESSION['role']}</p>";
    echo "<p><strong>Name:</strong> {$_SESSION['user_name']}</p>";
    echo "<a href='../../../logout.php'>Logout</a>";
} else {
    echo "<p>Not logged in</p>";
}

// Check database connection
echo "<h3>Database Check:</h3>";
if ($conn) {
    echo "✅ Database connection successful<br>";
    
    // Check users table
    $usersCheck = $conn->query("SHOW TABLES LIKE 'users'");
    if ($usersCheck->num_rows > 0) {
        echo "✅ Users table exists<br>";
        $userCount = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc();
        echo "- Users count: {$userCount['count']}<br>";
    } else {
        echo "❌ Users table does not exist<br>";
    }
    
    // Check owner table
    $ownerCheck = $conn->query("SHOW TABLES LIKE 'owner'");
    if ($ownerCheck->num_rows > 0) {
        echo "✅ Owner table exists<br>";
        $ownerCount = $conn->query("SELECT COUNT(*) as count FROM owner")->fetch_assoc();
        echo "- Owners count: {$ownerCount['count']}<br>";
    } else {
        echo "❌ Owner table does not exist<br>";
    }
    
} else {
    echo "❌ Database connection failed<br>";
}

echo "<br><a href='Login.php'>Test Login Page</a>";
?> 