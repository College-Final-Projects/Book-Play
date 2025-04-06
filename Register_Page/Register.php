<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];
    $username = $_POST['username'];
    $age = $_POST['age'];
    $gender = $_POST['gender'];
    $phone = $_POST['phone'];
    $description = $_POST['description'];
    $sports = isset($_POST['favoriteSport']) ? $_POST['favoriteSport'] : [];

    $user_image = '';
    if (isset($_FILES['user_image']) && $_FILES['user_image']['error'] === UPLOAD_ERR_OK) {
        $image_tmp = $_FILES['user_image']['tmp_name'];
        $original_name = basename($_FILES['user_image']['name']);
        $image_name = time() . '_' . $original_name;
    
        $user_folder = "uploads/users/" . $username . "/";
        if (!is_dir($user_folder)) {
            mkdir($user_folder, 0777, true); // إنشاء مجلد المستخدم إذا لم يكن موجود
        }
    
        $target_path = $user_folder . $image_name;
    
        if (move_uploaded_file($image_tmp, $target_path)) {
            $user_image = $target_path; // حفظ المسار في قاعدة البيانات
        }
    }
    

    $check = $conn->prepare("SELECT username FROM Users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "<script>alert('Username already exists. Please choose another one.'); window.history.back();</script>";
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO Users (username, email, password, first_name, last_name, age, Gender, phone_number, description, user_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssssss", $username, $email, $password, $firstName, $lastName, $age, $gender, $phone, $description, $user_image);

    if ($stmt->execute()) {
        $userSportStmt = $conn->prepare("INSERT INTO User_Favorite_Sports (username, sport_id) VALUES (?, ?)");
        foreach ($sports as $sportName) {
            $sportQuery = $conn->prepare("SELECT sport_id FROM Sports WHERE sport_name = ?");
            $sportQuery->bind_param("s", $sportName);
            $sportQuery->execute();
            $sportQuery->bind_result($sportId);
            if ($sportQuery->fetch()) {
                $userSportStmt->bind_param("si", $username, $sportId);
                $userSportStmt->execute();
            }
            $sportQuery->close();
        }

        echo "<script>alert('Registration successful!'); window.location.href = 'welcome.php';</script>";
    } else {
        echo "<script>alert('Error during registration.'); window.history.back();</script>";
    }

    $stmt->close();
    $check->close();
    $conn->close();
}
?>