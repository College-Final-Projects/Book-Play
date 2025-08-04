<?php
require_once '../../db.php';

$groupId = $_POST['group_id'] ?? null;
$username = $_POST['username'] ?? null;
$price = $_POST['price'] ?? null;

if (!$groupId || !$username || !is_numeric($price)) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $conn->prepare("UPDATE group_members SET payment_amount = ? WHERE group_id = ? AND username = ?");
$stmt->bind_param("dis", $price, $groupId, $username);
$success = $stmt->execute();

echo json_encode(['success' => $success]);
?>
