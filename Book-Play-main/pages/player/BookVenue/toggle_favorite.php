<?php
// Start output buffering to prevent any HTML output
ob_start();

// Suppress error reporting for clean JSON output
error_reporting(0);
ini_set('display_errors', 0);

session_start();

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

$user_id = $_SESSION['user_id'] ?? null;
$facility_id = $_POST['facility_id'] ?? null;

if (!$user_id || !$facility_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user or facility ID']);
    exit;
}

// Check if already exists
$stmt = $conn->prepare("SELECT * FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
$stmt->bind_param("si", $user_id, $facility_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Remove favorite
    $delete = $conn->prepare("DELETE FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
    $delete->bind_param("si", $user_id, $facility_id);
    $delete->execute();
    // Clean any output buffer and send only JSON
    ob_clean();
    ob_end_clean();
    
    echo json_encode(['success' => true, 'favorited' => false]);
} else {
    // Add favorite
    $insert = $conn->prepare("INSERT INTO user_favorite_facilities (user_id, facility_id) VALUES (?, ?)");
    $insert->bind_param("si", $user_id, $facility_id);
    $insert->execute();
    // Clean any output buffer and send only JSON
    ob_clean();
    ob_end_clean();
    
    echo json_encode(['success' => true, 'favorited' => true]);
}
?>
