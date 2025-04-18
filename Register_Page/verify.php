<?php
session_start();
require_once '../db.php';

header('Content-Type: application/json');

// 🧪 التحقق من الكود فقط (عند الضغط على زر Verify)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['code']) && !isset($_POST['username'])) {
    $code = $_POST['code'];

    if (!isset($_SESSION['verification_code']) || $code != $_SESSION['verification_code']) {
        echo json_encode([
            "status" => "error",
            "message" => "❌ Incorrect verification code."
        ]);
        exit();
    }

    // ✅ الكود صحيح – أظهر فورم البروفايل
    echo json_encode(["status" => "success"]);
    exit();
}

// 📥 إدخال البيانات الكاملة
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    $username     = $_POST['username'] ?? '';
    $firstName    = $_POST['firstName'] ?? '';
    $lastName     = $_POST['lastName'] ?? '';
    $age          = intval($_POST['age'] ?? 0);
    $gender       = $_POST['gender'] ?? '';
    $phone        = $_POST['phone'] ?? '';
    $description  = $_POST['description'] ?? '';
    $userImage    = $_FILES['user_image'] ?? null;

    if (!isset($_SESSION['temp_email']) || !isset($_SESSION['temp_password'])) {
        echo json_encode(["status" => "error", "message" => "⏳ Session expired. Please try again."]);
        exit();
    }

    $email = $_SESSION['temp_email'];
    $password = $_SESSION['temp_password'];

    // 🛡️ التحقق من أن اسم المستخدم غير مستخدم
    $checkUser = $conn->prepare("SELECT username FROM users WHERE username = ?");
    $checkUser->bind_param("s", $username);
    $checkUser->execute();
    $checkUser->store_result();

    if ($checkUser->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "❌ Username already exists."]);
        exit();
    }
    $checkUser->close();

    // 📷 رفع الصورة إذا وُجدت
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

    // 💾 إدخال المستخدم
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, first_name, last_name, age, gender, phone_number, description, user_image)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssssss", $username, $email, $password, $firstName, $lastName, $age, $gender, $phone, $description, $userImagePath);

    if ($stmt->execute()) {
        // 🧹 تنظيف الجلسة
        unset($_SESSION['temp_email'], $_SESSION['temp_password'], $_SESSION['verification_code']);

        echo json_encode([
            "status" => "success",
            "message" => "✅ Profile created successfully.",
            "redirect" => "../index.php"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "❌ Failed to save user."]);
    }

    $stmt->close();
    $conn->close();
    exit();
}

// إذا لم يكن POST
echo json_encode(["status" => "error", "message" => "⛔ Invalid request method."]);
exit();
?>
