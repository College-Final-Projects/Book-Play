<?php
session_start();
require_once '../../../db.php';

$username = $_SESSION['username'] ?? '';

if (isset($_GET['action']) && $_GET['action'] === 'remove_image') {
    $username = $_SESSION['username'] ?? '';
    if (!$username) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        exit;
    }

    // Delete image name from database
    $stmt = $conn->prepare("UPDATE users SET user_image = NULL WHERE username = ?");
    $stmt->bind_param("s", $username);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove image']);
    }
    exit;
}

// ✅ API to get user data (for JavaScript)
if (isset($_GET['action']) && $_GET['action'] === 'get_user_data') {
    header('Content-Type: application/json');

    if (!$username) {
        echo json_encode(['error' => 'Not logged in', 'redirect' => '../Login_Page/Login.php']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($user = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    exit;
}

// ✅ API to get sports list (for JavaScript)
if (isset($_GET['action']) && $_GET['action'] === 'get_sports') {
    header('Content-Type: application/json');
    
    // Sports list doesn't require login - it's public data
    $stmt = $conn->prepare("SELECT sport_id, sport_name FROM sports WHERE is_Accepted = 1 ORDER BY sport_name");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sports = [];
    while ($row = $result->fetch_assoc()) {
        $sports[] = $row;
    }
    
    echo json_encode(['success' => true, 'sports' => $sports]);
    exit;
}

// ✅ API to get user's favorite sports (for JavaScript)
if (isset($_GET['action']) && $_GET['action'] === 'get_user_sports') {
    header('Content-Type: application/json');
    
    if (!$username) {
        echo json_encode(['error' => 'Not logged in', 'redirect' => '../Login_Page/Login.php']);
        exit;
    }
    
    $stmt = $conn->prepare("
        SELECT s.sport_id, s.sport_name 
        FROM user_favorite_sports ufs 
        JOIN sports s ON ufs.sport_id = s.sport_id 
        WHERE ufs.username = ?
    ");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $userSports = [];
    while ($row = $result->fetch_assoc()) {
        $userSports[] = $row;
    }
    
    echo json_encode(['success' => true, 'user_sports' => $userSports]);
    exit;
}

// ✅ Check login when opening page directly (not for API calls)
// This should be the LAST check, only if no API action is specified
if (!isset($_GET['action'])) {
    if (!$username) {
        header("Location: ../Login_Page/Login.php");
        exit;
    }
}

// ✅ Handle saving changes (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName   = $_POST['firstName'];
    $lastName    = $_POST['lastName'];
    $age         = $_POST['age'];
    $gender      = $_POST['gender'];
    $phone       = $_POST['phone'];
    $description = $_POST['description'];
    $sports      = isset($_POST['favoriteSport']) ? $_POST['favoriteSport'] : [];

    // ✅ Handle profile image upload
    $user_image = null;
    if (isset($_FILES['user_image']) && $_FILES['user_image']['error'] === UPLOAD_ERR_OK) {
        $image_tmp      = $_FILES['user_image']['tmp_name'];
        $original_name  = basename($_FILES['user_image']['name']);
        $filename       = time() . "_" . $original_name;
        $upload_folder  = "../../../uploads/users/";

        if (!is_dir($upload_folder)) {
            mkdir($upload_folder, 0775, true);
        }

        $target_path = $upload_folder . $filename;

        if (move_uploaded_file($image_tmp, $target_path)) {
            $user_image = $filename;
        }
    }

    // ✅ Update users table
    if ($user_image) {
        $stmt = $conn->prepare("UPDATE users SET first_name=?, last_name=?, age=?, Gender=?, phone_number=?, description=?, user_image=? WHERE username=?");
        $stmt->bind_param("ssisssss", $firstName, $lastName, $age, $gender, $phone, $description, $user_image, $username);
    } else {
        $stmt = $conn->prepare("UPDATE users SET first_name=?, last_name=?, age=?, Gender=?, phone_number=?, description=? WHERE username=?");
        $stmt->bind_param("ssissss", $firstName, $lastName, $age, $gender, $phone, $description, $username);
    }

    $stmt->execute();
    $stmt->close();

    // ✅ Delete previous sports
    $deleteStmt = $conn->prepare("DELETE FROM user_favorite_sports WHERE username = ?");
    if ($deleteStmt) {
        $deleteStmt->bind_param("s", $username);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    // ✅ Insert new favorite sports
    if (!empty($sports)) {
        // Get all sport IDs in one query
        $sportNames = array_map(function($sport) use ($conn) {
            return "'" . $conn->real_escape_string($sport) . "'";
        }, $sports);
        $sportNamesStr = implode(',', $sportNames);
        
        $sportQuery = $conn->prepare("SELECT sport_id, sport_name FROM sports WHERE sport_name IN ($sportNamesStr)");
        $sportQuery->execute();
        $result = $sportQuery->get_result();
        
        $sportIdMap = [];
        while ($row = $result->fetch_assoc()) {
            $sportIdMap[$row['sport_name']] = $row['sport_id'];
        }
        $sportQuery->close();
        
        // Insert favorite sports
        $insertStmt = $conn->prepare("INSERT INTO user_favorite_sports (username, sport_id) VALUES (?, ?)");
        foreach ($sports as $sportName) {
            if (isset($sportIdMap[$sportName])) {
                $insertStmt->bind_param("si", $username, $sportIdMap[$sportName]);
                $insertStmt->execute();
            }
        }
        $insertStmt->close();
    }

  echo "<script>window.addEventListener('DOMContentLoaded', () => showModal());</script>";
  include 'EditProfile.html';
  $conn->close();
  exit;
}

// ✅ API to get previous page URL
if (isset($_GET['action']) && $_GET['action'] === 'prev') {
    header('Content-Type: application/json');
    echo json_encode(['url' => $_SESSION['previous_page'] ?? '']);
    exit;
}

// ✅ Display HTML page
require_once '../../../components/sports-scroll.php';
include 'EditProfile.html';
exit;
?>
