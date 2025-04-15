<?php
$host = "127.0.0.1";      // استخدم IP بدلاً من localhost
$db_user = "root";
$db_pass = "";
$db_name = "bookplay";
$port = 3307;

$conn = new mysqli($host, $db_user, $db_pass, $db_name, $port);

if ($conn->connect_error) {
    // ✅ نرجّع JSON بدلاً من HTML أو نص
    header('Content-Type: application/json');
    echo json_encode([
        "status" => "error",
        "message" => "❌ Database connection failed: " . $conn->connect_error
    ]);
    exit();
}
?>
