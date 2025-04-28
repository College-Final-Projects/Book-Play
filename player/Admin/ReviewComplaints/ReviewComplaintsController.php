<?php
require_once '../../db.php';
header('Content-Type: application/json');

// تحديد نوع العملية المطلوبة
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_place_reports':
        $reports = [];
        $sql = "SELECT * FROM reports WHERE type = 'report_place' ORDER BY created_at DESC";
        $result = $conn->query($sql);
    
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $reports[] = $row;
            }
        }
    
        echo json_encode($reports);
        break;
    
}
?>