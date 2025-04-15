<?php
require 'vendor/autoload.php';
require_once __DIR__ . '/../db.php';


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendVerificationCode($to, $code) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'bookandplay.team@gmail.com';
        $mail->Password = 'zfdi dqpm tyug tfvh'; // تأكد من أنها App Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('bookandplay.team@gmail.com', 'Book And Play');
        $mail->addAddress($to);

        $mail->isHTML(true);
        $mail->Subject = 'Your Verification Code';
        $mail->Body = "<h3>Your verification code is: <b>$code</b></h3>";

        $mail->send();
        return true;

    } catch (Exception $e) {
        error_log("Error sending verification email: {$mail->ErrorInfo}");
        return false;
    }
}
?>
