<?php
session_start();

// (اختياري) سجل وقت الخروج في قاعدة البيانات أو ملف

// احذف جميع متغيرات الجلسة
session_unset();

// دمر الجلسة تماماً
session_destroy();

// أعد التوجيه إلى صفحة تسجيل الدخول
header("Location: pages/auth/Login_Page/Login.php");
exit;
?>