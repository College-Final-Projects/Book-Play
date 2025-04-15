<?php
session_start();
require_once '../db.php';
require_once '../mail/MailLink.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $checkEmail = $conn->prepare("SELECT email FROM users WHERE email = ?");
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $checkEmail->store_result();

    if ($checkEmail->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "❌ This email is already registered."]);
        exit();
    }

    $code = rand(100000, 999999);
    $_SESSION['verification_code'] = $code;
    $_SESSION['temp_email'] = $email;
    $_SESSION['temp_password'] = $password;

    if (!sendVerificationCode($email, $code)) {
        echo json_encode(["status" => "error", "message" => "❌ Failed to send email."]);
        exit();
    }

    echo json_encode(["status" => "success", "message" => "✅ Verification code sent."]);
    exit();
}

// ✅ عرض واجهة التسجيل والحقن الذكي للمتغيرات
include "register.html";
if (isset($_SESSION['temp_email']) && isset($_SESSION['temp_password'])) {
    echo "<script>
      window.sessionUser = {
        email: '" . $_SESSION['temp_email'] . "',
        password: '" . $_SESSION['temp_password'] . "'
      };
    </script>";
}
exit();
?>
