<?php
include '../config/connection.php'; // התחברות ל-Firebase
$error_message = ""; // ברירת מחדל

if (isset($_POST['Login'])) {
    $email = $_POST['username'];
    $password = $_POST['password'];

    if (!empty($email) && !empty($password)) {
        $usersRef = $database->getReference('users')->getValue();

        if ($usersRef) {
            $userFound = false;

            foreach ($usersRef as $key => $user) {
                if ($user['email'] === $email) {
                    $userFound = true;

                    if ($user['password'] == $password) {
                        // סיסמה נכונה – הפניה לדשבורד
                        session_start();
                        $_SESSION['email'] = $email;
                        header("Location: dashboard.php");
                        exit;
                    } else {
                        // סיסמה שגויה
                        $error_message = "❌ Incorrect password!";
                        break;
                    }
                }
            }

            if (!$userFound) {
                $error_message = "⚠️ User not found!";
            }
        } else {
            $error_message = "⚠️ No users in the system.";
        }
    } else {
        $error_message = "⚠️ Please fill in all fields.";
    }
}

// הצגת הדף לאחר הטיפול ב-login
include 'Login.html';

?>
