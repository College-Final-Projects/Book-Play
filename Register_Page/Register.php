<?php
include "Register.html";
include '../config/connection.php';

// التحقق من تقديم النموذج
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['Register'])) {
    // جمع البيانات من النموذج
    $fullName = $_POST['fullName'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    if (!empty($fullName) && !empty($email) && !empty($password)) {
        // تجهيز بيانات المستخدم
        $userData = [
            'fullName' => $fullName,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_BCRYPT), // تشفير كلمة المرور
            'created_at' => date('Y-m-d H:i:s')
        ];

        // إدخال البيانات في Firebase Realtime Database
        $newUserRef = $database->getReference('users')->push($userData);

        if ($newUserRef) {
            // إعادة التوجيه إلى YouTube بعد التسجيل بنجاح
            header("Location: https://www.youtube.com");
            exit; // توقف السكربت هنا
        } else {
            echo "❌ حدث خطأ أثناء التسجيل.";
        }
    } else {
        echo "⚠️ الرجاء ملء جميع الحقول.";
    }
}
?>