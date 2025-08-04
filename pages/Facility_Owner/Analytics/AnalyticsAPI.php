<?php
session_start();
require_once '../../../db.php';
header('Content-Type: application/json');

// Get the requested action from the frontend
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // 📊 1. Fetch monthly booking analytics per facility
    case 'fetch_monthly_analytics':
        $facilities_id = intval($_GET['facilities_id'] ?? 0);

        if ($facilities_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid facility ID.']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT booking_day, booking_month, booking_year, total_bookings 
            FROM facilityinsights 
            WHERE facilities_id = ?
            ORDER BY booking_year DESC, booking_month DESC, booking_day DESC
        ");
        $stmt->bind_param("i", $facilities_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $analytics = [];
        while ($row = $result->fetch_assoc()) {
            $analytics[] = $row;
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
        $sql = "SELECT * FROM sportfacilities WHERE is_Accepted = 1";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $row['image_url'] = explode(",", $row['image_url'])[0]; // Return only first image
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