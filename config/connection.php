<?php
require __DIR__ . '/vendor/autoload.php';  // تعديل المسار ليتناسب مع موقع vendor

use Kreait\Firebase\Factory;

// استخدم __DIR__ للعثور على الملف بشكل صحيح
$serviceAccountPath = __DIR__ . '/book-play-7bf69-firebase-adminsdk-fbsvc-fe961d6eab.json';

if (!file_exists($serviceAccountPath)) {
    die("❌ Error: Service account JSON file not found at: " . realpath($serviceAccountPath));
}

// إنشاء اتصال مع Firebase
$firebase = (new Factory)
    ->withServiceAccount($serviceAccountPath)
    ->withDatabaseUri('https://book-play-7bf69-default-rtdb.firebaseio.com/')
    ->createDatabase();

// مرجع قاعدة البيانات
$database = $firebase;
?>
