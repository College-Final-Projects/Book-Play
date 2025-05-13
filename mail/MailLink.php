<?php
require 'vendor/autoload.php';
require_once __DIR__ . '/../db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Email Verification System
 * 
 * This function sends a verification code to a specified email address.
 * Used for account verification, password resets, and security confirmations.
 *
 * @param string $to   Recipient's email address
 * @param string $code Verification code to be sent
 * @return bool        True if email sent successfully, false otherwise
 */
function sendVerificationCode($to, $code) {
    // Initialize PHPMailer with exception handling enabled
    $mail = new PHPMailer(true);
    
    try {
        // Configure SMTP settings
        $mail->isSMTP();                                      // Use SMTP protocol
        $mail->Host = 'smtp.gmail.com';                       // Gmail SMTP server
        $mail->SMTPAuth = true;                               // Enable SMTP authentication
        $mail->Username = 'bookandplay.team@gmail.com';       // SMTP username
        $mail->Password = 'zfdi dqpm tyug tfvh';             // App Password (not regular password)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;   // Enable TLS encryption
        $mail->Port = 587;                                    // TCP port for TLS connection

        // Set email sender and recipient
        $mail->setFrom('bookandplay.team@gmail.com', 'Book And Play');
        $mail->addAddress($to);                               // Add recipient

        // Set email content
        $mail->isHTML(true);                                  // Set email format to HTML
        $mail->Subject = 'Your Verification Code';            // Email subject
        $mail->Body = "<h3>Your verification code is: <b>$code</b></h3>"; // HTML message

        // Send email and return success
        $mail->send();
        return true;

    } catch (Exception $e) {
        // Log error and return failure
        error_log("Error sending verification email: {$mail->ErrorInfo}");
        return false;
    }
}
?>