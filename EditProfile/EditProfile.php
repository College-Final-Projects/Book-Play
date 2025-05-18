<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username']; // passed via hidden field
    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];
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
            mkdir($user_folder, 0777, true);
        }

        $target_path = $user_folder . $image_name;

        if (move_uploaded_file($image_tmp, $target_path)) {
            $user_image = $target_path;
        }
    }

    // Update profile in Users table
    $stmt = $conn->prepare("UPDATE Users SET first_name=?, last_name=?, age=?, gender=?, phone_number=?, description=?, user_image=? WHERE username=?");
    $stmt->bind_param("ssisssss", $firstName, $lastName, $age, $gender, $phone, $description, $user_image, $username);
    $stmt->execute();
    $stmt->close();

    // Insert sports
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

    echo "<script>alert('Profile created successfully!'); window.location.href = '../HomePage/HomePage.html';</script>";
    $conn->close();
}

?>
