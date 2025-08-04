<?php
session_start();
require_once '../../../db.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    session_unset();
    session_destroy();
    header('Location: ../../../pages/auth/Login/Login.php');
    exit();
}

// API endpoint to get user's favorite facilities
if (isset($_GET['action']) && $_GET['action'] === 'get_favorites') {
    try {
        $username = $_SESSION['username'];
        
        $sql = "SELECT sf.*, uff.id as favorite_id
                FROM user_favorite_facilities uff
                JOIN sportfacilities sf ON uff.facility_id = sf.facilities_id
                WHERE uff.user_id = ? AND sf.is_Accepted = 1";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Database prepare error: " . $conn->error);
        }
        
        $stmt->bind_param("s", $username);
        if (!$stmt->execute()) {
            throw new Exception("Database execute error: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        $favorites = [];
        while ($row = $result->fetch_assoc()) {
            $favorites[] = [
                'id' => $row['facilities_id'],
                'name' => $row['place_name'],
                'sport' => $row['SportCategory'],
                'location' => $row['location'],
                'description' => $row['description'],
                'image' => $row['image_url'] ? $row['image_url'] : '../../../Images/Venue_icon.png',
                'price' => $row['price'],
                'is_available' => $row['is_available']
            ];
        }
        
        header('Content-Type: application/json');
        echo json_encode($favorites);
        exit();
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit();
    }
}

include '../navbar.html';
include 'Favorites.html';
?>