<?php
require 'vendor/autoload.php';
include "../config/connection.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

header('Content-Type: application/json');

if (isset($_POST["sendCodeButton"])) {
    $email = $_POST["email"];
    $usersRef = $database->getReference('users')->getValue();

    $userFound = false;
    $authenticationCode = mt_rand(10000, 99999);

    foreach ($usersRef as $key => $value) {
        if ($email === $value['email']) {
            $userFound = true;
            $username = $value["username"];
            
            try {
                // إعداد البريد
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'bookandplay.team@gmail.com';
                $mail->Password = 'yxfb ifsl szkz phma';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;
    
                $mail->setFrom('bookandplay.team@gmail.com', 'Book And Play Team');
                $mail->addAddress($value["email"], $value["username"]);
    
                $authenticationCode = mt_rand(10000, 99999);
    
                $mail->isHTML(true);
                $mail->Subject = 'Your Verification Code';
                $mail->Body = 'Your verification code is: <b>' . $authenticationCode . '</b>';
                $mail->AltBody = 'Your verification code is: ' . $authenticationCode;
    
                $mail->send();
    
                $database->getReference("users/$key/code")->set($authenticationCode);
                echo json_encode(["success" => true, "message" => "Code sent successfully!"]);
                exit;
            }catch (Exception $e) {
                echo json_encode(["success" => false, "message" => "Error sending email: " . $mail->ErrorInfo]);
                exit;
            }
        }
    }
}
/*try {
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'bookandplay.team@gmail.com'; 
    $mail->Password   = 'yxfb ifsl szkz phma'; 
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587; // 465 for SSL

    // Email Content
    $mail->setFrom('bookandplay.team@gmail.com');
    $mail->addAddress('recipient@example.com', 'Recipient Name');
    $mail->Subject = 'Test Email using PHPMailer';
    $mail->Body    = 'This is a test email sent using PHPMailer.';

    $mail->send();
    echo 'Email has been sent successfully!';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
}*/
?>
