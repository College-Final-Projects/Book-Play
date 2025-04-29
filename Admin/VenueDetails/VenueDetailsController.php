<?php
require_once '../../db.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_venue_details':
        // Get the venue ID from the request
        $venue_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if ($venue_id <= 0) {
            echo json_encode(['error' => 'Invalid venue ID']);
            exit;
        }
        
        // Query to get venue details from the facilities table
        $sql = "SELECT f.*, u.email as owner_email
                FROM sportfacilities f
                LEFT JOIN users u ON f.owner_username = u.username
                WHERE f.facilities_id = ?";
                
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $venue_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $venue = $result->fetch_assoc();
            echo json_encode($venue);
        } else {
            echo json_encode(['error' => 'Venue not found']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>