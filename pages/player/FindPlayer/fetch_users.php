<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

try {
    // Get current user's username
    $current_user = $_SESSION['username'];
    
    // Fetch all users except the current user
    $sql = "SELECT 
                u.username,
                u.first_name,
                u.last_name,
                u.email,
                u.age,
                u.Gender as gender,
                u.phone_number as phone,
                u.user_image,
                u.description,
                GROUP_CONCAT(DISTINCT s.sport_name) as favorite_sports
            FROM users u
            LEFT JOIN user_favorite_sports ufs ON u.username = ufs.username
            LEFT JOIN sports s ON ufs.sport_id = s.sport_id
            WHERE u.username != ?
            GROUP BY u.username";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $current_user);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        // Set default image if none exists
        $image = $row['user_image'] ? '../../../uploads/users/' . $row['user_image'] : '../../Images/default.jpg';
        
        // Format name
        $name = trim($row['first_name'] . ' ' . $row['last_name']);
        if (empty($name)) {
            $name = $row['username'];
        }
        
        // Format phone number
        $phone = $row['phone'] ?: 'Not provided';
        
        // Get favorite sports
        $favorite_sports = $row['favorite_sports'] ?: 'No favorite sports';
        
        // Calculate age if birth date is available
        $age = $row['age'] ?: 'Not specified';
        
        // Set location (you can modify this based on your needs)
        $location = 'Tel Aviv'; // Default location, you can add location field to users table
        
        // Calculate distance (mock calculation for now)
        $distance = rand(1, 20) . '.' . rand(0, 9) . ' km away';
        
        $users[] = [
            'name' => $name,
            'username' => $row['username'],
            'email' => $row['email'],
            'age' => $age,
            'gender' => $row['gender'] ?: 'Not specified',
            'phone' => $phone,
            'location' => $location,
            'distance' => $distance,
            'image' => $image,
            'sport' => $favorite_sports,
            'description' => $row['description'] ?: 'No description available'
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode(['users' => $users]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

$stmt->close();
$conn->close();
?> 