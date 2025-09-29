<?php
// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

try {
    session_start();
    require_once '../../../db.php';

    // Check if user is logged in
    $currentUser = $_SESSION['username'] ?? '';
    if (!$currentUser) {
        echo json_encode(['success' => false, 'error' => 'User not logged in']);
        exit;
    }

    // Check database connection
    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit;
    }

    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'fetch_sports':
            getSports($conn);
            break;
        
        case 'fetch_venues':
            getVenues($conn, $currentUser);
            break;
        
        case 'toggle_favorite':
            toggleFavorite($conn, $currentUser);
            break;
        
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }

} catch (Exception $e) {
    error_log("Exception in BookVenueAPI.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function getSports($conn) {
    $sql = "SELECT sport_name FROM sports WHERE is_Accepted = 1";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch sports']);
        return;
    }

    $sports = [];
    while ($row = $result->fetch_assoc()) {
        $sports[] = $row['sport_name'];
    }

    echo json_encode(['success' => true, 'sports' => $sports]);
}

function getVenues($conn, $currentUser) {
    // Collect filters
    $sports = isset($_GET['sports']) ? $_GET['sports'] : [];
    $search = isset($_GET['search']) ? trim($_GET['search']) : "";

    $conditions = ["is_Accepted = 1"];
    $params = [];
    $types = "";

    // Filter by sports
    if (!empty($sports)) {
        $placeholders = implode(',', array_fill(0, count($sports), '?'));
        $conditions[] = "SportCategory IN ($placeholders)";
        $params = array_merge($params, $sports);
        $types .= str_repeat('s', count($sports));
    }

    // Filter by venue name start (like JoinGroup page)
    if (!empty($search)) {
        $conditions[] = "place_name LIKE ?";
        $params[] = $search . '%';
        $types .= 's';
    }

    $whereClause = implode(" AND ", $conditions);

    $sql = "
      SELECT 
        f.*, 
        COALESCE(ROUND(AVG(r.rating_value), 1), 0) AS avg_rating,
        CASE WHEN fav.facility_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
      FROM sportfacilities f
      LEFT JOIN ratings r ON f.facilities_id = r.facilities_id 
      LEFT JOIN user_favorite_facilities fav ON f.facilities_id = fav.facility_id AND fav.user_id = ?
      WHERE $whereClause
      GROUP BY f.facilities_id
    ";

    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param('s' . $types, $currentUser, ...$params);
    } else {
        $stmt->bind_param('s', $currentUser);
    }

    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Failed to prepare statement']);
        return;
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $venues = [];
    while ($row = $result->fetch_assoc()) {
        $venues[] = $row;
    }

    $stmt->close();

    echo json_encode(['success' => true, 'venues' => $venues]);
}

function toggleFavorite($conn, $currentUser) {
    $facility_id = $_POST['facility_id'] ?? null;

    if (!$facility_id) {
        echo json_encode(['success' => false, 'error' => 'Missing facility ID']);
        return;
    }

    // Check if already exists
    $stmt = $conn->prepare("SELECT * FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
    $stmt->bind_param("si", $currentUser, $facility_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Remove favorite
        $delete = $conn->prepare("DELETE FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
        $delete->bind_param("si", $currentUser, $facility_id);
        $delete->execute();
        echo json_encode(['success' => true, 'favorited' => false]);
    } else {
        // Add favorite
        $insert = $conn->prepare("INSERT INTO user_favorite_facilities (user_id, facility_id) VALUES (?, ?)");
        $insert->bind_param("si", $currentUser, $facility_id);
        $insert->execute();
        echo json_encode(['success' => true, 'favorited' => true]);
    }
}
?>
