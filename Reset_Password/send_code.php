<?php
session_start();
require_once '../db.php';
require_once '../mail/MailLink.php';

header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action === 'send_code') {
    $email = $_POST['email'] ?? '';

    if (empty($email)) {
        echo json_encode(["success" => false, "message" => "📭 Please enter your email."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "❌ Email not registered."]);
        exit;
    }

    $code = rand(100000, 999999);
    $_SESSION['reset_code'] = $code;
    $_SESSION['reset_email'] = $email;

    if (sendVerificationCode($email, $code)) {
        echo json_encode(["success" => true, "message" => "✅ Verification code sent."]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Failed to send email."]);
    }
    exit;
}

if ($action === 'verify_code') {
    $code = $_POST['code'] ?? '';

    if (!isset($_SESSION['reset_code']) || $code != $_SESSION['reset_code']) {
        echo json_encode(["success" => false, "message" => "❌ Incorrect verification code."]);
    } else {
        echo json_encode(["success" => true, "message" => "✅ Code verified."]);
    }
    exit;
}

if ($action === 'reset_password') {
    $newPassword = $_POST['new_password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    if ($newPassword !== $confirmPassword) {
        echo json_encode(["success" => false, "message" => "❌ Passwords do not match."]);
        exit;
    }

    if (!isset($_SESSION['reset_email'])) {
        echo json_encode(["success" => false, "message" => "⏳ Session expired. Try again."]);
        exit;
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $email = $_SESSION['reset_email'];

    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->bind_param("ss", $hashedPassword, $email);

    if ($stmt->execute()) {
        unset($_SESSION['reset_email'], $_SESSION['reset_code']);
        echo json_encode(["success" => true, "message" => "✅ Password updated."]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Failed to update password."]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "⛔ Invalid action."]);
exit;
?>
