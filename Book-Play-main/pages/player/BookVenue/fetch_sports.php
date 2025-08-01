<?php
// Start output buffering to prevent any HTML output
ob_start();

// Suppress error reporting for clean JSON output
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// Try multiple database paths with error handling
$db_paths = [
    'C:/wamp64/www/Book-Play-main/Book-Play-main/db.php',
    '../../../db.php',
    '../../../../db.php'
];

$db_loaded = false;
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        try {
            require_once $path;
            if (isset($conn) && !$conn->connect_error) {
                $db_loaded = true;
                break;
            }
        } catch (Exception $e) {
            continue;
        }
    }
}

if (!$db_loaded) {
    ob_clean();
    ob_end_clean();
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed - no valid path found"
    ]);
    exit();
}

if (!isset($conn) || $conn->connect_error) {
    ob_clean();
    ob_end_clean();
    echo json_encode([
        "success" => false, 
        "message" => "Database connection failed",
        "error" => isset($conn) ? $conn->connect_error : "Connection variable not set"
    ]);
    exit();
}

$sql = "SELECT sport_name FROM sports WHERE is_Accepted = 1";
$result = $conn->query($sql);

$sports = [];
while ($row = $result->fetch_assoc()) {
    $sports[] = $row['sport_name'];
}

// Clean any output buffer and send only JSON
ob_clean();
ob_end_clean();

echo json_encode(["success" => true, "sports" => $sports]);

$conn->close();
?>