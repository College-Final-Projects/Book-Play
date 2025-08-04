<?php
session_start();
$htmlPath = __DIR__ . "/Reset_Password.html";

if (file_exists($htmlPath)) {
    readfile($htmlPath);
} else {
    echo "❌ Reset_Password.html not found!";
}
?>
