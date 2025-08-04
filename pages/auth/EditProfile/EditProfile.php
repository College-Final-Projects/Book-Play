<?php
session_start();
require_once '../../../db.php';

$username = $_SESSION['user_id'] ?? '';

if (isset($_GET['action']) && $_GET['action'] === 'remove_image') {
    $username = $_SESSION['user_id'] ?? '';
    if (!$username) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        exit;
    }

    // حذف اسم الصورة من قاعدة البيانات
    $stmt = $conn->prepare("UPDATE users SET user_image = NULL WHERE username = ?");
    $stmt->bind_param("s", $username);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove image']);
    }
    exit;
}

// ✅ API لجلب بيانات المستخدم (للجافاسكربت)
if (isset($_GET['action']) && $_GET['action'] === 'get_user_data') {
    header('Content-Type: application/json');

    if (!$username) {
        echo json_encode(['error' => 'Not logged in']);
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

// ✅ تحقق من تسجيل الدخول عند فتح الصفحة مباشرة
if (!$username) {
    header("Location: ../Login_Page/Login.php");
    exit;
}

// ✅ معالجة حفظ التعديلات (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName   = $_POST['firstName'];
    $lastName    = $_POST['lastName'];
    $age         = $_POST['age'];
    $gender      = $_POST['gender'];
    $phone       = $_POST['phone'];
    $description = $_POST['description'];
    $sports      = isset($_POST['favoriteSport']) ? $_POST['favoriteSport'] : [];

    // ✅ معالجة رفع صورة البروفايل
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

    // ✅ تحديث جدول المستخدمين
    if ($user_image) {
        $stmt = $conn->prepare("UPDATE users SET first_name=?, last_name=?, age=?, Gender=?, phone_number=?, description=?, user_image=? WHERE username=?");
        $stmt->bind_param("ssisssss", $firstName, $lastName, $age, $gender, $phone, $description, $user_image, $username);
    } else {
        $stmt = $conn->prepare("UPDATE users SET first_name=?, last_name=?, age=?, Gender=?, phone_number=?, description=? WHERE username=?");
        $stmt->bind_param("ssissss", $firstName, $lastName, $age, $gender, $phone, $description, $username);
    }

    $stmt->execute();
    $stmt->close();

    // ✅ حذف الرياضات السابقة
    $deleteStmt = $conn->prepare("DELETE FROM user_favorite_sports WHERE username = ?");
    if ($deleteStmt) {
        $deleteStmt->bind_param("s", $username);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    // ✅ إدراج الرياضات المفضلة الجديدة
    $insertStmt = $conn->prepare("INSERT INTO user_favorite_sports (username, sport_id) VALUES (?, ?)");
    foreach ($sports as $sportName) {
        $sportQuery = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
        $sportQuery->bind_param("s", $sportName);
        $sportQuery->execute();
        $sportQuery->bind_result($sportId);
        if ($sportQuery->fetch()) {
            $insertStmt->bind_param("si", $username, $sportId);
            $insertStmt->execute();
        }
        $sportQuery->close();
    }
    $insertStmt->close();

  echo "<script>window.addEventListener('DOMContentLoaded', () => showModal());</script>";
include 'EditProfile.html';
exit;
    $conn->close();
    exit;
}
if (isset($_GET['action']) && $_GET['action'] === 'prev') {
    header('Content-Type: application/json');
    echo json_encode(['url' => $_SESSION['previous_page'] ?? '']);
    exit;
}


// ✅ عرض الصفحة HTML
require_once '../../../components/sports-scroll.php';
include 'EditProfile.html';
exit;
?>
