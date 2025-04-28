<?php
session_start();
require_once '../db.php';

// Function to get sports HTML
function getSportsHTML() {
    global $conn;
    
    $sportsHTML = '';
    
    // Get sports from database
    $result = $conn->query("SELECT * FROM `sports` WHERE is_Accepted = 1");
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $sportId = $row['sport_id'];
            $sport = htmlspecialchars($row['sport_name']);
            
            $sportsHTML .= "<div class='sport-option'>";
            // Use sport_id as the value
            $sportsHTML .= "<input type='checkbox' id='sport-$sportId' name='favorite_sports[]' value='$sportId'>";
            $sportsHTML .= "<label for='sport-$sportId' class='sport-label'>$sport</label>";
            $sportsHTML .= "</div>";
        }
    } else {
        $sportsHTML = "<p>No sports available</p>";
    }
    
    return $sportsHTML;
}

// If it's just a request for sports HTML
if (isset($_GET['get_sports']) && $_GET['get_sports'] == 1) {
    echo getSportsHTML();
    exit();
}

// For all other operations, set JSON header
header('Content-Type: application/json');

// 🧪 Code verification (when Verify button is clicked)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['code']) && !isset($_POST['username'])) {
    $code = $_POST['code'];

    if (!isset($_SESSION['verification_code']) || $code != $_SESSION['verification_code']) {
        echo json_encode([
            "status" => "error",
            "message" => "❌ Incorrect verification code."
        ]);
        exit();
    }

    // ✅ Code is correct - show profile form
    echo json_encode(["status" => "success"]);
    exit();
}

// 📥 Complete data submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    $username     = $_POST['username'] ?? '';
    $firstName    = $_POST['firstName'] ?? '';
    $lastName     = $_POST['lastName'] ?? '';
    $age          = intval($_POST['age'] ?? 0);
    $gender       = $_POST['gender'] ?? '';
    $phone        = $_POST['phone'] ?? '';
    $description  = $_POST['description'] ?? '';
    $userImage    = $_FILES['user_image'] ?? null;
    $favoriteSports = isset($_POST['favorite_sports']) ? $_POST['favorite_sports'] : [];

    if (!isset($_SESSION['temp_email']) || !isset($_SESSION['temp_password'])) {
        echo json_encode(["status" => "error", "message" => "⏳ Session expired. Please try again."]);
        exit();
    }

    $email = $_SESSION['temp_email'];
    $password = $_SESSION['temp_password'];

    // 🛡️ Check that username isn't already in use
    $checkUser = $conn->prepare("SELECT username FROM users WHERE username = ?");
    $checkUser->bind_param("s", $username);
    $checkUser->execute();
    $checkUser->store_result();

    if ($checkUser->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "❌ Username already exists."]);
        exit();
    }
    $checkUser->close();

    // 📷 Upload image if provided
    $userImagePath = null;
    if ($userImage && $userImage['tmp_name']) {
        $targetDir = "../uploads/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        $filename = uniqid() . "_" . basename($userImage["name"]);
        $targetFile = $targetDir . $filename;

        if (move_uploaded_file($userImage["tmp_name"], $targetFile)) {
            $userImagePath = $filename;
        }
    }

    // 💾 Insert user
    $stmt = $conn->prepare("INSERT INTO users (username, email, first_name, last_name, password, description, age, gender, phone_number, user_image)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssisss", $username, $email, $firstName, $lastName, $password, $description, $age, $gender, $phone, $userImagePath);

    if ($stmt->execute()) {
        $userId = $conn->insert_id;
        
        // Insert favorite sports
        if (!empty($favoriteSports)) {
            $sportInsertStmt = $conn->prepare("INSERT INTO user_favorite_sports (username, sport_id) VALUES (?, ?)");
            
            foreach ($favoriteSports as $sportId) {
                $sportInsertStmt->bind_param("si", $username, $sportId);
                $sportInsertStmt->execute();
            }
            
            $sportInsertStmt->close();
        }
        
        // 🧹 Clean up session
        unset($_SESSION['temp_email'], $_SESSION['temp_password'], $_SESSION['verification_code']);

        echo json_encode([
            "status" => "success",
            "message" => "✅ Profile created successfully.",
            "redirect" => "../index.php"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "❌ Failed to save user: " . $conn->error]);
    }

    $stmt->close();
    $conn->close();
    exit();
}

// If not a POST request
echo json_encode(["status" => "error", "message" => "⛔ Invalid request method."]);
exit();
?>