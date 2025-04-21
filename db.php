<?php
$host = "127.0.0.1:3306";      // استخدم IP بدلاً من localhost
$db_user = "root";
$db_pass = "";
$db_name = "bookplay";

try{
    $conn = new mysqli($host, $db_user, $db_pass, $db_name);
} catch(Exception){
    $host = "127.0.0.1:3307";
    $conn = new mysqli($host, $db_user, $db_pass, $db_name);
}
finally{
    if ($conn->connect_error) {
            die("❌ Connection failed: " . $conn->connect_error);
    }
}
?>
