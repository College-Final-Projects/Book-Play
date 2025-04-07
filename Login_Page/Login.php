<?php
// بدء الجلسة
session_start();

// التحقق مما إذا كان المستخدم مسجل الدخول بالفعل
if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
    // إعادة توجيه المستخدم إلى لوحة التحكم
    header('Location: dashboard.php');
    exit;
}

// تضمين ملف HTML للعرض
include 'Login.html';
?>