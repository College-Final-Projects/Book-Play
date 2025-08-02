<?php
file_put_contents("cron-log.txt", "Check ran at " . date("Y-m-d H:i:s") . "\n", FILE_APPEND);
require_once '../../db.php'; // تعديل المسار حسب مكانك
require_once '../../Mailer.php'; // دالة إرسال البريد عبر PHPMailer

date_default_timezone_set('Asia/Jerusalem'); // اضبط التوقيت المحلي

// استعلام لكل الحجوزات القديمة التي مضى أكثر من ساعة على إنشائها
$sql = "
    SELECT b.booking_id, b.created_at, b.Total_Price, g.group_id
    FROM bookings b
    JOIN groups g ON g.booking_id = b.booking_id
    WHERE TIMESTAMPDIFF(MINUTE, b.created_at, NOW()) >= 60
";
$res = $conn->query($sql);

while ($row = $res->fetch_assoc()) {
    $bookingId = $row['booking_id'];
    $groupId = $row['group_id'];
    $totalPrice = (float)$row['Total_Price'];
    $minimumPayment = $totalPrice * 0.2;

    // حساب مجموع المدفوعات للمجموعة
    $stmt = $conn->prepare("SELECT SUM(payment_amount) as total_paid FROM group_members WHERE group_id = ?");
    $stmt->bind_param("i", $groupId);
    $stmt->execute();
    $paidRow = $stmt->get_result()->fetch_assoc();
    $totalPaid = (float)$paidRow['total_paid'];

    // إذا لم يتم دفع 20% → احذف الحجز وأرسل بريد
    if ($totalPaid < $minimumPayment) {
        // اجلب أعضاء المجموعة
        $members = [];
        $stmt2 = $conn->prepare("SELECT u.email, u.username FROM group_members gm JOIN users u ON gm.username = u.username WHERE gm.group_id = ?");
        $stmt2->bind_param("i", $groupId);
        $stmt2->execute();
        $resMembers = $stmt2->get_result();
        while ($m = $resMembers->fetch_assoc()) {
            $members[] = $m;
        }

        // حذف الحجز من الجداول الثلاثة
        $conn->query("DELETE FROM group_members WHERE group_id = $groupId");
        $conn->query("DELETE FROM groups WHERE group_id = $groupId");
        $conn->query("DELETE FROM bookings WHERE booking_id = $bookingId");

        // إرسال البريد
        foreach ($members as $m) {
            $to = $m['email'];
            $subject = "Booking Cancelled - Book&Play";
            $body = "Hello {$m['username']},\n\nYour booking (ID: $bookingId) was automatically cancelled because your group did not pay at least 20% of the total venue price within 1 hour.\n\nRegards,\nBook&Play Team";
            sendEmail($to, $subject, $body);
        }
    }
}
?>
