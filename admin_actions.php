<?php
session_start();
require_once '../../../db.php';

$username = $_SESSION['user_id'] ?? '';

if (!$username) {
  echo json_encode(["success" => false, "message" => "Not logged in"]);
  exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'check') {
  // فحص admin ووجود طلب سابق
  $stmt = $conn->prepare("SELECT is_admin FROM users WHERE username = ?");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($isAdmin);
  $stmt->fetch();
  $stmt->close();

  $stmt = $conn->prepare("SELECT COUNT(*) FROM reports WHERE username = ? AND type = 'admin_request'");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($count);
  $stmt->fetch();
  $stmt->close();

  echo json_encode([
    "is_admin" => $isAdmin == 1,
    "already_requested" => $count > 0
  ]);
  exit;
}

if ($action === 'submit') {
  // تحقق من وجود طلب قديم
  $stmt = $conn->prepare("SELECT COUNT(*) FROM reports WHERE username = ? AND type = 'admin_request'");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($count);
  $stmt->fetch();
  $stmt->close();

  if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Request already exists"]);
    exit;
  }

  $stmt = $conn->prepare("INSERT INTO reports (username, type, message) VALUES (?, 'admin_request', 'Requesting admin access')");
  $stmt->bind_param("s", $username);
  $success = $stmt->execute();
  $stmt->close();

  echo json_encode(["success" => $success]);
  exit;
}

echo json_encode(["success" => false, "message" => "Invalid action"]);
?>