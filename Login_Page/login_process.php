<?php
session_start();
require_once '../db.php'; 

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = $_POST['username'];
    $password = $_POST['password'];

    if (empty($identifier) || empty($password)) {
        $response['message'] = 'يرجى ملء جميع الحقول المطلوبة';
    } else {
        $user = null;
        $role = null;

        // 🔎 أولًا نبحث في جدول admins بواسطة admin_email
        $stmt = $conn->prepare("SELECT * FROM admins WHERE admin_email = ? LIMIT 1");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            $role = 'admin';
        }
        $stmt->close();

        // 🔎 إذا لم يوجد، نبحث في جدول users بواسطة username فقط
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
                $_SESSION['is_logged_in'] = true;
                $_SESSION['role'] = $role;

                if ($role === 'admin') {
                    $_SESSION['user_id'] = $user['admin_email'];
                    $_SESSION['user_name'] = 'Administrator';
                    $response['redirect'] = 'admin_dashboard.php';
                } else {
                    $_SESSION['user_id'] = $user['username'];
                    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                    $response['redirect'] = 'user_dashboard.php';
                }

                $response['success'] = true;
                $response['message'] = '✅ تم تسجيل الدخول بنجاح!';
            } else {
                $response['message'] = '❌ كلمة المرور غير صحيحة';
            }
        } else {
            $response['message'] = '❌ المستخدم غير موجود';
        }
    }
}

header('Content-Type: application/json');
echo json_encode($response);
$conn->close();
?>
