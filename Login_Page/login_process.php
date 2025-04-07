<?php
// استيراد ملف الاتصال بقاعدة البيانات
require_once '../db.php'; 

// تهيئة الرد
$response = array('success' => false, 'message' => '');

// التحقق من أن الطلب هو POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // الحصول على بيانات النموذج
    $email = $_POST['email'];
    $password = $_POST['password'];
    
    // التحقق من وجود القيم
    if (empty($email) || empty($password)) {
        $response['message'] = 'يرجى ملء جميع الحقول المطلوبة';
    } else {
        // استعلام للتحقق من وجود المستخدم
        $sql = "SELECT username, password, first_name, last_name FROM users WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // التحقق من كلمة المرور
            if (password_verify($password, $user['password'])) {
                // بدء جلسة
                session_start();
                
                // تخزين معلومات المستخدم في الجلسة
                $_SESSION['user_id'] = $user['username']; // لأن username هو المفتاح الأساسي
                $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name']; // تجميع الاسم
                $_SESSION['is_logged_in'] = true;
                
                $response['success'] = true;
                $response['message'] = 'تم تسجيل الدخول بنجاح!';
            } else {
                $response['message'] = 'كلمة المرور غير صحيحة';
            }
        } else {
            $response['message'] = 'البريد الإلكتروني غير مسجل';
        }
        
        $stmt->close();
    }
}

// إرسال الرد كـ JSON
header('Content-Type: application/json');
echo json_encode($response);

// إغلاق الاتصال بقاعدة البيانات
$conn->close();
?>
