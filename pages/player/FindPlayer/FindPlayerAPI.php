<?php
require_once '../../../db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$username = $_SESSION['username'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'save_availability':
        saveAvailability($username);
        break;
    case 'get_availability':
        getAvailability($username);
        break;
    case 'get_visibility_status':
        getVisibilityStatus($username);
        break;
    case 'get_all_players':
        getAllPlayers($username);
        break;
    case 'sort_by_me':
        sortByMe($username);
        break;
    case 'add_friend':
        addFriend($username);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

function saveAvailability($username) {
    global $conn;
    
    // Debug: Log received data
    error_log("Received POST data for user: " . $username);
    
    $availabilityRaw = $_POST['availability'] ?? null;
    $isAvailable = $_POST['isAvailable'] ?? 1;
    
    if (!$availabilityRaw) {
        http_response_code(400);
        echo json_encode(['error' => 'No availability data received']);
        return;
    }
    
    $availability = json_decode($availabilityRaw, true);
    
    if ($availability === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON in availability data: ' . json_last_error_msg()]);
        return;
    }
    
    error_log("Parsed availability data: " . print_r($availability, true));
    
    try {
        // Begin transaction
        $conn->begin_transaction();
        
        // First, delete ALL existing availability for this user
        $stmt = $conn->prepare("DELETE FROM user_availability WHERE username = ?");
        $stmt->bind_param("s", $username);
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete existing availability: " . $stmt->error);
        }
        
        // Only insert if we have actual availability data (not empty object)
        $hasAvailabilityData = false;
        foreach ($availability as $day => $slots) {
            if (is_array($slots)) {
                $hasAvailabilityData = true;
                break;
            }
        }
        
        if ($hasAvailabilityData) {
            // Insert new availability data
            foreach ($availability as $day => $slots) {
                $dayNumber = getDayNumber($day);
                
                error_log("Processing day: '$day' -> dayNumber: $dayNumber"); // Debug log
                
                // Skip if dayNumber is 0 (invalid day)
                if ($dayNumber == 0) {
                    error_log("WARNING: Invalid day name received: '$day'");
                    continue;
                }
                
                if (empty($slots)) {
                    // User is available all day (no specific time slots)
                    $stmt = $conn->prepare("INSERT INTO user_availability (username, day_of_week, start_time, end_time, is_available) VALUES (?, ?, '00:00:00', '23:59:59', ?)");
                    $stmt->bind_param("sii", $username, $dayNumber, $isAvailable);
                    if (!$stmt->execute()) {
                        throw new Exception("Failed to save all-day availability: " . $stmt->error);
                    }
                    error_log("Saved all-day availability for day $dayNumber ($day)");
                } else {
                    // User has specific time slots
                    foreach ($slots as $slot) {
                        $startTime = $slot['start'];
                        $endTime = $slot['end'];
                        
                        // Validate time slots
                        if ($startTime >= $endTime) {
                            throw new Exception("Start time must be before end time");
                        }
                        
                        $stmt = $conn->prepare("INSERT INTO user_availability (username, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)");
                        $stmt->bind_param("sissi", $username, $dayNumber, $startTime, $endTime, $isAvailable);
                        if (!$stmt->execute()) {
                            throw new Exception("Failed to save time slot: " . $stmt->error);
                        }
                        error_log("Saved time slot for day $dayNumber ($day): $startTime - $endTime");
                    }
                }
            }
        } else {
            // No availability data, create a special record just to store visibility status
            error_log("No availability data found, saving visibility status only");
            $stmt = $conn->prepare("INSERT INTO user_availability (username, day_of_week, start_time, end_time, is_available) VALUES (?, -1, '00:00:00', '00:00:00', ?)");
            $stmt->bind_param("si", $username, $isAvailable);
            if (!$stmt->execute()) {
                throw new Exception("Failed to save visibility status: " . $stmt->error);
            }
            error_log("Saved visibility status only (no availability set)");
        }
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode(['success' => true, 'message' => 'Availability saved successfully']);
        
    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        
        error_log("Error saving availability for user $username: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getAvailability($username) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT day_of_week, start_time, end_time, is_available FROM user_availability WHERE username = ? ORDER BY day_of_week, start_time");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $availability = [];
    
    while ($row = $result->fetch_assoc()) {
        $dayNumber = $row['day_of_week'];
        
        // Skip special visibility-only records (day_of_week = -1)
        if ($dayNumber == -1) {
            continue;
        }
        
        // Skip any invalid day numbers
        if ($dayNumber < 1 || $dayNumber > 7) {
            continue;
        }
        
        $dayName = getDayName($dayNumber);
        
        if (!isset($availability[$dayName])) {
            $availability[$dayName] = [];
        }
        
        // If it's all day (00:00:00 to 23:59:59), return empty array for that day
        if ($row['start_time'] === '00:00:00' && $row['end_time'] === '23:59:59') {
            if (empty($availability[$dayName])) {
                $availability[$dayName] = []; // Empty array means "all day"
            }
        } else {
            // Specific time slots
            $availability[$dayName][] = [
                'start' => $row['start_time'],
                'end' => $row['end_time'],
                'is_available' => $row['is_available']
            ];
        }
    }
    
    echo json_encode($availability);
}

function getVisibilityStatus($username) {
    global $conn;
    
    // Check for any availability record to get visibility status
    $stmt = $conn->prepare("SELECT is_available FROM user_availability WHERE username = ? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo json_encode(['is_available' => (bool)$row['is_available']]);
    } else {
        // If no availability records exist, default to available
        echo json_encode(['is_available' => true]);
    }
}

// Get ALL players (for regular search - not filtered by availability or sports)
function getAllPlayers($username) {
    global $conn;
    
    $searchTerm = $_GET['search'] ?? '';
    
    $query = "
        SELECT DISTINCT u.username, u.first_name, u.last_name, u.age, u.Gender, u.phone_number, u.user_image,
               GROUP_CONCAT(DISTINCT s.sport_name) as favorite_sports
        FROM users u
        LEFT JOIN user_favorite_sports ufs ON u.username = ufs.username
        LEFT JOIN sports s ON ufs.sport_id = s.sport_id
        WHERE u.username != ? 
        AND u.is_admin = 0
    ";
    
    $params = [$username];
    $types = "s";
    
    if (!empty($searchTerm)) {
        $query .= " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ?)";
        $searchParam = "%$searchTerm%";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam]);
        $types .= "sss";
    }
    
    $query .= " GROUP BY u.username ORDER BY u.first_name, u.last_name";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $players = [];
    while ($row = $result->fetch_assoc()) {
        $players[] = [
            'username' => $row['username'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name']),
            'age' => $row['age'],
            'gender' => $row['Gender'],
            'phone' => $row['phone_number'],
            'image' => $row['user_image'] ? '../../../uploads/users/' . $row['user_image'] : '../../../Images/default.jpg',
            'favorite_sports' => $row['favorite_sports'] ? explode(',', $row['favorite_sports']) : [],
            'distance' => rand(1, 15) . '.' . rand(0, 9) . ' km away'
        ];
    }
    
    echo json_encode($players);
}

// Sort By Me - FIXED to support time overlap instead of exact match
function sortByMe($username) {
    global $conn;
    
    // Step 1: Get my favorite sports
    $stmt = $conn->prepare("SELECT sport_id FROM user_favorite_sports WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $mySports = [];
    while ($row = $result->fetch_assoc()) {
        $mySports[] = $row['sport_id'];
    }
    
    // Step 2: Get my available slots
    $stmt = $conn->prepare("SELECT day_of_week, start_time, end_time FROM user_availability WHERE username = ? AND is_available = 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $myAvailability = [];
    while ($row = $result->fetch_assoc()) {
        $myAvailability[] = [
            'day_of_week' => $row['day_of_week'],
            'start_time' => $row['start_time'],
            'end_time' => $row['end_time']
        ];
    }
    
    // If I have no sports and no availability, show only players with same sports
    if (empty($mySports) && empty($myAvailability)) {
        echo json_encode([]);
        return;
    }
    
    // Step 3: Build the matching query with TIME OVERLAP LOGIC
    $query = "
        SELECT DISTINCT u.username, u.first_name, u.last_name, u.age, u.Gender, u.phone_number, u.user_image,
               GROUP_CONCAT(DISTINCT s.sport_name) as favorite_sports
        FROM users u
        LEFT JOIN user_favorite_sports ufs ON u.username = ufs.username
        LEFT JOIN sports s ON ufs.sport_id = s.sport_id
        LEFT JOIN user_availability ua ON u.username = ua.username
        WHERE u.username != ? 
        AND u.is_admin = 0
        AND ua.is_available = 1
    ";
    
    $conditions = [];
    $params = [$username];
    $types = "s";
    
    // REQUIREMENT: Must have same favorite sports
    if (!empty($mySports)) {
        $placeholders = str_repeat('?,', count($mySports) - 1) . '?';
        $conditions[] = "ufs.sport_id IN ($placeholders)";
        $params = array_merge($params, $mySports);
        $types .= str_repeat('i', count($mySports));
    }
    
    // REQUIREMENT: Matching availability logic with TIME OVERLAP
    if (!empty($myAvailability)) {
        $availabilityConditions = [];
        
        foreach ($myAvailability as $slot) {
            if ($slot['start_time'] === '00:00:00' && $slot['end_time'] === '23:59:59') {
                // I'm available ALL DAY on this day
                // Show ALL people available on this day (any time)
                $availabilityConditions[] = "ua.day_of_week = ?";
                $params[] = $slot['day_of_week'];
                $types .= "i";
            } else {
                // I have SPECIFIC TIMES on this day
                // FIXED: Show people with OVERLAPPING times (not exact match)
                // Time overlap condition: their_start_time < my_end_time AND their_end_time > my_start_time
                $availabilityConditions[] = "(ua.day_of_week = ? AND ua.start_time < ? AND ua.end_time > ?)";
                $params[] = $slot['day_of_week'];
                $params[] = $slot['end_time'];      // My end time
                $params[] = $slot['start_time'];    // My start time
                $types .= "iss";
            }
        }
        
        if (!empty($availabilityConditions)) {
            $conditions[] = "(" . implode(" OR ", $availabilityConditions) . ")";
        }
    } else {
        // If I have no availability set, just match by sports only
        // This is already handled by the sports condition above
    }
    
    // Apply all conditions
    if (!empty($conditions)) {
        $query .= " AND (" . implode(" AND ", $conditions) . ")";
    }
    
    $query .= " GROUP BY u.username ORDER BY u.first_name, u.last_name";
    
    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $players = [];
    while ($row = $result->fetch_assoc()) {
        $players[] = [
            'username' => $row['username'],
            'name' => trim($row['first_name'] . ' ' . $row['last_name']),
            'age' => $row['age'],
            'gender' => $row['Gender'],
            'phone' => $row['phone_number'],
            'image' => $row['user_image'] ? '../../../uploads/users/' . $row['user_image'] : '../../../Images/default.jpg',
            'favorite_sports' => $row['favorite_sports'] ? explode(',', $row['favorite_sports']) : [],
            'distance' => rand(1, 15) . '.' . rand(0, 9) . ' km away'
        ];
    }
    
    echo json_encode($players);
}

// Add friend functionality
function addFriend($username) {
    global $conn;
    
    $targetUsername = $_POST['target_username'] ?? '';
    
    if (empty($targetUsername)) {
        http_response_code(400);
        echo json_encode(['error' => 'Target username is required']);
        return;
    }
    
    if ($username === $targetUsername) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot add yourself as friend']);
        return;
    }
    
    try {
        // Check if friendship already exists
        $stmt = $conn->prepare("SELECT * FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)");
        $stmt->bind_param("ssss", $username, $targetUsername, $targetUsername, $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(['error' => 'Already friends']);
            return;
        }
        
        // Check if target user exists
        $stmt = $conn->prepare("SELECT username FROM users WHERE username = ?");
        $stmt->bind_param("s", $targetUsername);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Add friendship (both directions for easier querying)
        $stmt = $conn->prepare("INSERT INTO friends (user1, user2) VALUES (?, ?), (?, ?)");
        $stmt->bind_param("ssss", $username, $targetUsername, $targetUsername, $username);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Friend request sent successfully']);
        } else {
            throw new Exception('Failed to add friend');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Helper functions
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
    return $days[strtolower($dayName)] ?? 0; // Return 0 if day not found (which should not happen)
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