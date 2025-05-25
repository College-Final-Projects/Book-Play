<?php
session_start();
require_once '../../db.php';

if ($_GET['action'] === 'get_facilities') {
    getFacilities();
}

function getFacilities() {
    global $conn;

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
        return;
    }

    $username = $_SESSION['user_id'];

    $stmt = $conn->prepare("SELECT * FROM sportfacilities WHERE owner_username = ? AND is_Accepted = 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    $facilities = [];
    while ($row = $result->fetch_assoc()) {
        $facilities[] = $row;
    }

    echo json_encode($facilities);
}
