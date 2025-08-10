<?php
session_start();
header('Content-Type: application/json');
require_once '../../../db.php';

try {
    // Get current user's username from session
    $currentUsername = $_SESSION['username'] ?? '';
    
    if (empty($currentUsername)) {
        throw new Exception('User not authenticated');
    }
    
    // Fetch all users except the current user, with their favorite sports and coordinates
    $sql = "SELECT 
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.age,
                u.Gender as gender,
                u.phone_number as phone,
                u.user_image,
                u.latitude,
                u.longitude,
                GROUP_CONCAT(s.sport_name SEPARATOR ', ') as favorite_sports
            FROM users u
            LEFT JOIN user_favorite_sports ufs ON u.username = ufs.username
            LEFT JOIN sports s ON ufs.sport_id = s.sport_id
            WHERE u.username != ?
            GROUP BY u.username
            ORDER BY u.first_name, u.last_name";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $currentUsername);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        // Process user image path
        $imagePath = '';
        if (!empty($row['user_image']) && $row['user_image'] !== 'null') {
            if (filter_var($row['user_image'], FILTER_VALIDATE_URL)) {
                $imagePath = $row['user_image'];
            } else {
                $imagePath = '../../../uploads/users/' . $row['user_image'];
            }
        } else {
            $imagePath = '../../../uploads/users/default.jpg';
        }
        
        // Create display name from first and last name
        $displayName = trim($row['first_name'] . ' ' . $row['last_name']);
        if (empty($displayName)) {
            $displayName = $row['username']; // Fallback to username if no name
        }
        
        // Get primary sport (first favorite sport or default)
        $primarySport = !empty($row['favorite_sports']) ? explode(', ', $row['favorite_sports'])[0] : 'General';
        
        // Create user object
        $user = [
            'name' => $displayName,
            'email' => $row['email'],
            'sport' => $primarySport,
            'age' => $row['age'] ?? 'N/A',
            'gender' => $row['gender'] ?? 'Not specified',
            'phone' => $row['phone'] ?? 'Not provided',
            'latitude' => $row['latitude'] ?? null,
            'longitude' => $row['longitude'] ?? null,
            'location' => 'Tel Aviv', // Default location for now
            'distance' => 'Location not set', // Will be calculated by JavaScript if coordinates available
            'image' => $imagePath,
            'username' => $row['username'],
            'favorite_sports' => $row['favorite_sports'] ?? ''
        ];
        
        $users[] = $user;
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching users: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
