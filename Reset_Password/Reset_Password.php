<?php

include '../mail/MailLink.php';
include '../config/connection.php';

header('Content-Type: application/json');

if (isset($_POST["email"]) && isset($_POST["code"]) && isset($_POST["new_password"])) {
    $email = $_POST["email"];
    $code = $_POST["code"];
    $newPassword = password_hash($_POST["new_password"], PASSWORD_BCRYPT); // تشفير كلمة المرور
    $usersRef = $database->getReference('users')->getValue();
    $userFound = false;

    foreach ($usersRef as $key => $value) {
        if ($email == $value['email'] && isset($value['code']) && $code == $value['code']) {
            $userFound = true;

            // تحديث كلمة المرور
            $database->getReference("users/$key/password")->set($newPassword);

            // حذف كود التحقق بعد الاستخدام
            $database->getReference("users/$key/code")->remove();

            echo json_encode(["success" => true, "message" => "Password reset successfully!"]);
            exit;
        }
    }

    if (!$userFound) {
        echo json_encode(["success" => false, "message" => "Invalid email or verification code!"]);
    }
}
?>
