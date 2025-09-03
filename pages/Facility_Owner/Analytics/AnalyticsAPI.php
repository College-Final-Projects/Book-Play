<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get the requested action from the frontend
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // 📊 1. Fetch monthly booking analytics per facility
    case 'fetch_monthly_analytics':
        $venueName = $_GET['venue'] ?? '';
        $year = intval($_GET['year'] ?? date('Y'));

        if (empty($venueName)) {
            echo json_encode(['success' => false, 'message' => 'Venue name is required.']);
            exit;
        }

        // Get the facility ID first
        $stmt = $conn->prepare("SELECT facilities_id FROM sportfacilities WHERE place_name = ? AND owner_username = ?");
        $stmt->bind_param("ss", $venueName, $_SESSION['username']);
        $stmt->execute();
        $facilityResult = $stmt->get_result();
        
        if ($facilityResult->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Venue not found or not owned by you.']);
            exit;
        }
        
        $facility = $facilityResult->fetch_assoc();
        $facilities_id = $facility['facilities_id'];

        // Fetch actual booking data grouped by month and date
        $stmt = $conn->prepare("
            SELECT 
                DATE(booking_date) as date,
                COUNT(*) as bookings,
                SUM(Total_Price) as total_price
            FROM bookings 
            WHERE facilities_id = ? 
            AND YEAR(booking_date) = ?
            GROUP BY DATE(booking_date)
            ORDER BY date ASC
        ");
        $stmt->bind_param("ii", $facilities_id, $year);
        $stmt->execute();
        $result = $stmt->get_result();

        $analytics = [];
        while ($row = $result->fetch_assoc()) {
            $month = date('F', strtotime($row['date']));
            if (!isset($analytics[$month])) {
                $analytics[$month] = [];
            }
            $analytics[$month][] = [
                'date' => date('M d, Y', strtotime($row['date'])),
                'bookings' => intval($row['bookings']),
                'total' => floatval($row['total_price'])
            ];
        }

        echo json_encode(['success' => true, 'data' => $analytics]);
        break;

    // 🏅 2. Fetch all accepted sports
    case 'fetch_sports':
        $sports = [];
        $sql = "SELECT * FROM sports WHERE is_Accepted = 1";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $sports[] = $row;
            }
        }

        echo json_encode(['success' => true, 'sports' => $sports]);
        break;

    // 🏟️ 3. Fetch all accepted venues
    case 'fetch_venues':
        $venues = [];
        
        // More specific query to ensure we get all necessary fields
        $sql = "SELECT 
                    facilities_id, 
                    place_name, 
                    location, 
                    description, 
                    image_url, 
                    owner_username, 
                    SportCategory, 
                    price, 
                    is_Accepted 
                FROM sportfacilities 
                WHERE is_Accepted = 1";
        
        $result = $conn->query($sql);

        if (!$result) {
            echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
            exit;
        }

        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                // Handle image_url - get first image if it's a comma-separated list
                if (!empty($row['image_url']) && $row['image_url'] !== 'null' && $row['image_url'] !== '') {
                    $images = explode(",", $row['image_url']);
                    $row['image_url'] = trim($images[0]); // Return only first image, trimmed
                } else {
                    $row['image_url'] = null; // Set to null if no image
                }
                
                $venues[] = $row;
            }
        }

        echo json_encode(['success' => true, 'venues' => $venues]);
        break;

    // ⛔ Handle unknown action
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid or missing action.']);
        break;
}

$conn->close();
?>