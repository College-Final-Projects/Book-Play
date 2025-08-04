<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

$username = $_SESSION['username'];

// Handle different actions
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'save_availability':
        saveAvailability($username, $conn);
        break;
    case 'get_availability':
        getAvailability($username, $conn);
        break;
    case 'toggle_availability':
        toggleAvailability($username, $conn);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

function saveAvailability($username, $conn) {
    // Get the availability data from POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['availability'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
        return;
    }
    
    $availability = $input['availability'];
    $isAvailable = $input['isAvailable'] ?? false;
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Delete existing availability for this user
        $deleteStmt = $conn->prepare("DELETE FROM user_availability WHERE username = ?");
        $deleteStmt->bind_param("s", $username);
        $deleteStmt->execute();
        
        // Save the new availability (even if user is not marked as available)
        if (!empty($availability)) {
            $insertStmt = $conn->prepare("INSERT INTO user_availability (username, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($availability as $day => $slots) {
                $dayNumber = getDayNumber($day);
                
                foreach ($slots as $slot) {
                    if (isset($slot['start']) && isset($slot['end'])) {
                        $isAvailableValue = $isAvailable ? 1 : 0;
                        
                        // Convert "23:59" to "23:59:59" for database storage
                        $startTime = $slot['start'];
                        $endTime = $slot['end'];
                        
                        if ($endTime === '23:59') {
                            $endTime = '23:59:59';
                        }
                        
                        $insertStmt->bind_param("sissi", $username, $dayNumber, $startTime, $endTime, $isAvailableValue);
                        $insertStmt->execute();
                    }
                }
            }
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Availability saved successfully']);
        
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAvailability($username, $conn) {
    $stmt = $conn->prepare("SELECT day_of_week, start_time, end_time, is_available FROM user_availability WHERE username = ? ORDER BY day_of_week, start_time");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $availability = [];
    $isAvailable = false;
    
    while ($row = $result->fetch_assoc()) {
        $dayName = getDayName($row['day_of_week']);
        if (!isset($availability[$dayName])) {
            $availability[$dayName] = [];
        }
        
        // Convert "23:59:59" back to "23:59" for display
        $endTime = $row['end_time'];
        if ($endTime === '23:59:59') {
            $endTime = '23:59';
        }
        
        $availability[$dayName][] = [
            'start' => $row['start_time'],
            'end' => $endTime
        ];
        
        if ($row['is_available'] == 1) {
            $isAvailable = true;
        }
    }
    
    echo json_encode([
        'availability' => $availability,
        'isAvailable' => $isAvailable
    ]);
}

function toggleAvailability($username, $conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    $isAvailable = $input['isAvailable'] ?? false;
    
    if ($isAvailable) {
        // If turning on availability, we need to save the availability data
        saveAvailability($username, $conn);
    } else {
        // If turning off availability, delete all availability records
        $stmt = $conn->prepare("DELETE FROM user_availability WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Availability turned off']);
    }
}

function getDayNumber($dayName) {
    $days = [
        'sunday' => 1,
        'monday' => 2,
        'tuesday' => 3,
        'wednesday' => 4,
        'thursday' => 5,
        'friday' => 6,
        'saturday' => 7
    ];
    
    return $days[strtolower($dayName)] ?? 1;
}

function getDayName($dayNumber) {
    $days = [
        1 => 'sunday',
        2 => 'monday',
        3 => 'tuesday',
        4 => 'wednesday',
        5 => 'thursday',
        6 => 'friday',
        7 => 'saturday'
    ];
    
    return $days[$dayNumber] ?? 'sunday';
}
?> 