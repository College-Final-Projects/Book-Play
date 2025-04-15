<?php
session_start();
require_once '../db.php';

header('Content-Type: application/json');

// ✅ التحقق من نوع الطلب
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code = $_POST['code'];

    // ❌ التحقق من الكود
    if (!isset($_SESSION['verification_code']) || $code != $_SESSION['verification_code']) {
        echo json_encode([
            "status" => "error",
            "message" => "❌ Incorrect verification code."
        ]);
        exit();
    }

    // ❌ التحقق من وجود الجلسة
    if (!isset($_SESSION['temp_email']) || !isset($_SESSION['temp_password'])) {
        echo json_encode([
            "status" => "error",
            "message" => "⏳ Session expired. Please try again."
        ]);
        exit();
    }

    // ✅ الكود صحيح، نبدأ التخزين
    $email = $_SESSION['temp_email'];
    $password = $_SESSION['temp_password'];

    // إدخال المستخدم بدون اسم المستخدم (سيُكمل لاحقًا في صفحة البروفايل)
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $password);

    if ($stmt->execute()) {
        // 🧹 تنظيف الجلسة
        unset($_SESSION['temp_email'], $_SESSION['temp_password'], $_SESSION['verification_code']);

        echo json_encode([
            "status" => "success",
            "redirect" => "../Profile/profile-setup.php"
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "❌ Error saving user to the database."
        ]);
    }

    $stmt->close();
    $conn->close();
    exit();
}

// ⛔ إذا الطلب مش POST
echo json_encode([
    "status" => "error",
    "message" => "⛔ Invalid request method."
]);
exit();
?>
