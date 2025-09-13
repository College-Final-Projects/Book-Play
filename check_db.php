<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;port=3307;dbname=bookplay;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    echo "Database connection successful!\n\n";
    
    // Show existing tables
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Existing tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Check if bookings table exists and show its structure
    if (in_array('bookings', $tables)) {
        echo "\nBookings table structure:\n";
        $stmt = $db->query("DESCRIBE bookings");
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            echo "- {$column['Field']}: {$column['Type']} {$column['Null']} {$column['Key']}\n";
        }
    }
    
    // Check if booking_participants table exists
    if (in_array('booking_participants', $tables)) {
        echo "\nBooking_participants table structure:\n";
        $stmt = $db->query("DESCRIBE booking_participants");
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            echo "- {$column['Field']}: {$column['Type']} {$column['Null']} {$column['Key']}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
