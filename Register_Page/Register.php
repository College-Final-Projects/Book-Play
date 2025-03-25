<?php
include '../config/connection.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // استقبال البيانات من النموذج
  
    $email= $_POST['email'] ?? '';
    $password= $_POST['password'] ?? '';
    $firstName = $_POST['firstName'] ?? '';
    $lastName = $_POST['lastName'] ?? '';
    $username = $_POST['username'] ?? '';
    $age = $_POST['age'] ?? '';
    $gender = $_POST['gender'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $favoriteSport = $_POST['favoriteSport'] ?? [];
    $description = $_POST['description'] ?? '';
    echo "<pre>";
    print_r($_POST);
    echo "</pre>";
    
    if (!empty($firstName) && !empty($lastName) && !empty($username) && !empty($age) && !empty($gender)&& !empty($email)&& !empty($password)) {
        $profileData = [
            'email' => $email,
            'password' => $password,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'username' => $username,
            'age' => (int)$age,
            'gender' => $gender,
            'phone' => $phone,
            'favoriteSport' => is_array($favoriteSport) ? $favoriteSport : [$favoriteSport],
            'description' => $description,
            'created_at' => date('Y-m-d H:i:s')
        ];

        $newProfileRef = $database->getReference('users')->push($profileData);

        if ($newProfileRef) {
            header("Location: ../Login_Page/Login.php");
            exit;
        } else {
            echo "❌ فشل في حفظ البيانات في قاعدة البيانات.";
        }
    } else {
        echo "⚠️ تأكد من ملء جميع الحقول المطلوبة.";
    }
}
?>
