<?php
$host = "127.0.0.1:3307";
$db_user = "root";
$db_pass = "";
$db_name = "bookplay";
$port = 3307;

$conn = new mysqli($host, $db_user, $db_pass, $db_name, $port);

if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
}