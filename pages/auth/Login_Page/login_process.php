<?php
session_start();
require_once '../../../db.php'; 

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = $_POST['username'];
    $password = $_POST['password'];

    if (empty($identifier) || empty($password)) {
        $response['message'] = 'Please fill in all required fields';
    } else {
        $user = null;
        $role = null;

        // 🔎 First check in the owner table by owner_email
        $stmt = $conn->prepare("SELECT * FROM owner WHERE owner_email = ? LIMIT 1");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            $role = 'owner';
        }
        $stmt->close();

        // 🔎 If not found, check in the users table by username only
        if (!$user) {
            $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
            $stmt->bind_param("s", $identifier);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                $role = 'user';
            }
            $stmt->close();
        }

        if ($user) {
            if (password_verify($password, $user['password'])) {
                $_SESSION['role'] = $role;

                if ($role === 'owner') {
                    $_SESSION['user_id'] = $user['owner_email'];
                    $_SESSION['user_name'] = 'Administrator';
                    $response['redirect'] = '../../pages/Owner/Owner.php';
                } else {
                    $_SESSION['user_id'] = $user['username'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $response['redirect'] = '../User_Selection_Page/user-selection.php';
                }

                $response['success'] = true;
                $response['message'] = '✅ Login successful!';
            } else {
                $response['message'] = '❌ Incorrect password';
            }
        } else {
            $response['message'] = '❌ User not found';
        }
    }
}

header('Content-Type: application/json');
echo json_encode($response);
$conn->close();
?>