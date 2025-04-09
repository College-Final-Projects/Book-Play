<?php
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $username = $_POST['username'];

    $check = $conn->prepare("SELECT username FROM Users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "<script>alert('Username already exists. Please choose another one.'); window.history.back();</script>";
        exit();
    }

    // Insert minimal info to Users table
    $stmt = $conn->prepare("INSERT INTO Users (username, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $password);

    if ($stmt->execute()) {
        echo "<script>window.location.href = '../Profile/profile.html?username=$username';</script>";
    } else {
        echo "<script>alert('Error during registration.'); window.history.back();</script>";
    }

    $stmt->close();
    $check->close();
    $conn->close();
}

?>