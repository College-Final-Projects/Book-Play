<?php 
session_start(); 
require_once '../../db.php'; 

// تحقق من تسجيل الدخول
if (!isset($_SESSION['username'])) { 
    echo "User not logged in. Please login first.";
    exit; 
} 

$username = $_SESSION['username']; 
echo "<h2>Testing Venues for User: " . htmlspecialchars($username) . "</h2>";

// الاستعلام مع عدد الحجوزات لكل ملعب
$sql = "
    SELECT 
        f.facilities_id,
        f.place_name,
        f.image_url,
        f.price,
        f.is_Accepted,
        f.description,
        f.location,
        COUNT(b.booking_id) AS total_bookings
    FROM sportfacilities f
    LEFT JOIN bookings b ON f.facilities_id = b.facilities_id
    WHERE f.owner_username = ?
    GROUP BY f.facilities_id
"; 

$stmt = $conn->prepare($sql); 

if (!$stmt) {
    echo "<p style='color: red;'>Database prepare error: " . $conn->error . "</p>";
    exit;
}

$stmt->bind_param("s", $username); 
$stmt->execute(); 
$result = $stmt->get_result(); 

echo "<h3>Database Query Results:</h3>";
echo "<p>Found " . $result->num_rows . " venues</p>";

if ($result->num_rows === 0) {
    echo "<p style='color: orange;'>No venues found for this user. Make sure you have venues in the database.</p>";
} else {
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Name</th><th>Image</th><th>Price</th><th>Bookings</th><th>Accepted</th><th>Description</th><th>Location</th>";
    echo "</tr>";
    
    $venues = [];

    while ($row = $result->fetch_assoc()) { 
        // جدول HTML
        echo "<tr>";
        echo "<td>" . $row['facilities_id'] . "</td>";
        echo "<td><strong>" . htmlspecialchars($row['place_name']) . "</strong></td>";
        echo "<td>" . htmlspecialchars($row['image_url'] ?: 'No image') . "</td>";
        echo "<td>₪" . $row['price'] . "</td>";
        echo "<td>" . $row['total_bookings'] . "</td>";
        echo "<td>" . ($row['is_Accepted'] ? 'Yes' : 'No') . "</td>";
        echo "<td>" . htmlspecialchars($row['description'] ?? 'No description') . "</td>";
        echo "<td>" . htmlspecialchars($row['location'] ?? 'No location') . "</td>";
        echo "</tr>";

        // بيانات JSON
        $venues[] = [ 
            'id' => (int)$row['facilities_id'],
            'name' => $row['place_name'], 
            'image' => $row['image_url'] ?: 'default.jpg', 
            'price' => (float)$row['price'], 
            'bookings' => (int)$row['total_bookings'],
            'isAccepted' => (bool)$row['is_Accepted'],
            'description' => $row['description'] ?? '',
            'location' => $row['location'] ?? ''
        ]; 
    }

    echo "</table>";
    echo "<hr><h3>JSON Format (for JavaScript):</h3>";
    echo "<pre>" . json_encode($venues, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
}

$stmt->close();
?>
