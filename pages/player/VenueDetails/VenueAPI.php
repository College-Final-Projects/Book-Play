<?php
// VenueAPI.php - returns facility details + comments

// Add debugging at the very beginning
error_log("=== VENUEAPI.PHP DEBUG START ===");
error_log("Script started at: " . date('Y-m-d H:i:s'));

// Check if db.php exists and get its path
$dbPath = '../../../db.php';
$realDbPath = realpath($dbPath);
error_log("DB file path requested: " . $dbPath);
error_log("DB file real path: " . ($realDbPath ? $realDbPath : 'FILE NOT FOUND'));

if (!$realDbPath) {
    error_log("❌ CRITICAL ERROR: db.php file not found!");
    echo json_encode(['success' => false, 'message' => 'Database file not found']);
    exit;
}

require_once $dbPath;
header('Content-Type: application/json');

// Add debugging
error_log("VenueAPI.php called with facility_id: " . ($_GET['facilities_id'] ?? 'null'));
error_log("Current working directory: " . getcwd());
error_log("DB file path: " . realpath('../../../db.php'));

// Simple test endpoint
if (isset($_GET['test'])) {
    echo json_encode(['success' => true, 'message' => 'API is working', 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
}

// Check database connection
error_log("Checking database connection...");
if ($conn->connect_error) {
    error_log("❌ Database connection failed: " . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

error_log("✅ Database connection successful");

$facilityId = $_GET['facilities_id'] ?? null;
error_log("Facility ID received: " . $facilityId);

if (!$facilityId) {
    error_log("❌ No facility_id provided");
    echo json_encode(['success' => false, 'message' => 'Facility ID is missing']);
    exit;
}

error_log("Processing facility_id: " . $facilityId);

// Test database query first
error_log("Testing basic database query...");
$testQuery = "SELECT COUNT(*) as count FROM sportfacilities";
$testResult = $conn->query($testQuery);
if (!$testResult) {
    error_log("❌ Basic database query failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
    exit;
}
$testRow = $testResult->fetch_assoc();
error_log("✅ Database query test successful. Total facilities: " . $testRow['count']);

// Fetch facility details with owner information
error_log("Preparing facility query...");
$stmt = $conn->prepare("
    SELECT sf.* 
    FROM sportfacilities sf 
    WHERE sf.facilities_id = ?
");

if (!$stmt) {
    error_log("❌ Prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Database prepare failed: ' . $conn->error]);
    exit;
}

error_log("✅ Prepare successful, binding parameters...");
$stmt->bind_param("i", $facilityId);
error_log("✅ Parameters bound, executing query...");
$stmt->execute();
$result = $stmt->get_result();

if (!$row = $result->fetch_assoc()) {
    error_log("❌ No facility found for ID: " . $facilityId);
    echo json_encode(['success' => false, 'message' => 'Facility not found with ID: ' . $facilityId]);
    exit;
}

error_log("✅ Facility found: " . json_encode($row));

// Fetch comments for this facility
error_log("Fetching comments for facility_id: " . $facilityId);
$commentsStmt = $conn->prepare("SELECT username, rating_value, comment FROM ratings WHERE facilities_id = ?");
if (!$commentsStmt) {
    error_log("❌ Comments prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Comments query failed: ' . $conn->error]);
    exit;
}

$commentsStmt->bind_param("i", $facilityId);
$commentsStmt->execute();
$commentsResult = $commentsStmt->get_result();

$comments = [];
while ($commentRow = $commentsResult->fetch_assoc()) {
    $comments[] = $commentRow;
}

error_log("✅ Comments fetched: " . count($comments) . " comments");

// Calculate average rating
error_log("Calculating average rating...");
$avgRatingStmt = $conn->prepare("SELECT AVG(rating_value) as avg_rating FROM ratings WHERE facilities_id = ?");
if (!$avgRatingStmt) {
    error_log("❌ Average rating prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Average rating query failed: ' . $conn->error]);
    exit;
}

$avgRatingStmt->bind_param("i", $facilityId);
$avgRatingStmt->execute();
$avgRatingResult = $avgRatingStmt->get_result();
$avgRow = $avgRatingResult->fetch_assoc();
$averageRating = $avgRow['avg_rating'] ? round($avgRow['avg_rating'], 1) : 0; // Handle null values

error_log("✅ Average rating calculated: " . $averageRating);

// Return combined JSON
$response = [
  'success' => true,
  'facility' => $row,
  'comments' => $comments,
  'average_rating' => $averageRating
];

error_log("✅ Preparing final response...");
error_log("Response data: " . json_encode($response));
echo json_encode($response);
error_log("=== VENUEAPI.PHP DEBUG END ===");

?>