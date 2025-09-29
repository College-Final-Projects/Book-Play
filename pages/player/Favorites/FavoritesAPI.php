<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

$username = $_SESSION['username'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if (!$username) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

if ($method === 'GET' && $action === 'list') {
    try {
        $sql = "SELECT 
                    f.facilities_id,
                    f.place_name,
                    f.location,
                    f.description,
                    f.image_url,
                    f.SportCategory,
                    f.price,
                    f.is_available,
                    f.latitude,
                    f.longitude,
                    COALESCE(AVG(r.rating_value), 0) as average_rating,
                    COUNT(r.rating_value) as rating_count
                FROM user_favorite_facilities uff
                JOIN sportfacilities f ON uff.facility_id = f.facilities_id
                LEFT JOIN ratings r ON f.facilities_id = r.facilities_id
                WHERE uff.user_id = ? AND f.is_Accepted = 1
                GROUP BY f.facilities_id
                ORDER BY f.place_name ASC";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        $favorites = [];
        while ($row = $result->fetch_assoc()) {
            $imageUrl = $row['image_url'];
            if (empty($imageUrl) || $imageUrl === 'null' || $imageUrl === '') {
                $imageUrl = '../../../Images/default.jpg';
            } else {
                if (!filter_var($imageUrl, FILTER_VALIDATE_URL) && !str_starts_with($imageUrl, '/')) {
                    $imageUrl = '../../../uploads/venues/' . $imageUrl;
                }
            }

            $favorites[] = [
                'id' => $row['facilities_id'],
                'name' => $row['place_name'],
                'sport' => $row['SportCategory'],
                'location' => $row['location'],
                'description' => $row['description'],
                'price' => $row['price'],
                'rating' => round($row['average_rating'], 1),
                'rating_count' => $row['rating_count'],
                'image' => $imageUrl,
                'is_available' => $row['is_available'],
                'latitude' => $row['latitude'],
                'longitude' => $row['longitude'],
                'isFavorite' => true
            ];
        }

        echo json_encode([
            'success' => true,
            'favorites' => $favorites,
            'count' => count($favorites)
        ]);
        exit;
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching favorites: ' . $e->getMessage()
        ]);
        exit;
    }
}

if ($method === 'POST' && $action === 'remove') {
    $facility_id = $_POST['facility_id'] ?? null;
    if (!$facility_id) {
        echo json_encode(['success' => false, 'message' => 'Missing facility ID']);
        exit;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM user_favorite_facilities WHERE user_id = ? AND facility_id = ?");
        $stmt->bind_param("si", $username, $facility_id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Removed from favorites']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Facility not found in favorites']);
        }
        exit;
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error removing from favorites: ' . $e->getMessage()
        ]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>

