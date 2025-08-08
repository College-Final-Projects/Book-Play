<?php
session_start();
require_once '../../../db.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "❌ You must be logged in to suggest a sport."]);
    exit;
}

$username = $_SESSION['username'];

// Handle POST request for submitting sport suggestion
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sport_name = trim($_POST['sport_name'] ?? '');
    $message = trim($_POST['message'] ?? '');
    
    if (empty($sport_name)) {
        echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
        exit;
    }
    
    // Check if this sport already exists in the sports table
    $check_existing_sport = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
    $check_existing_sport->bind_param("s", $sport_name);
    $check_existing_sport->execute();
    $existing_result = $check_existing_sport->get_result();
    
    if ($existing_result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "❌ This sport already exists in our database."]);
        $check_existing_sport->close();
        exit;
    }
    $check_existing_sport->close();
    
    // Check if this sport suggestion already exists from this user
    $check_stmt = $conn->prepare("SELECT report_id FROM reports WHERE username = ? AND type = 'suggest_sport' AND suggested_sport_name = ?");
    $check_stmt->bind_param("ss", $username, $sport_name);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "❌ You have already suggested this sport."]);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Insert the sport suggestion
    $stmt = $conn->prepare("INSERT INTO reports (username, type, suggested_sport_name, message, created_at) VALUES (?, 'suggest_sport', ?, ?, NOW())");
    $stmt->bind_param("sss", $username, $sport_name, $message);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "✅ Sport suggestion submitted successfully! We'll review it soon."]);
    } else {
        echo json_encode(["success" => false, "message" => "❌ Failed to submit sport suggestion. Please try again."]);
    }
    $stmt->close();
    exit;
}

// Handle GET request for checking if user has already suggested a specific sport
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sport_name = trim($_GET['sport_name'] ?? '');
    
    if (empty($sport_name)) {
        echo json_encode(["success" => false, "message" => "❌ Sport name is required."]);
        exit;
    }
    
    // Check if sport already exists in database
    $check_existing = $conn->prepare("SELECT sport_id FROM sports WHERE sport_name = ?");
    $check_existing->bind_param("s", $sport_name);
    $check_existing->execute();
    $existing_result = $check_existing->get_result();
    $already_exists = $existing_result->num_rows > 0;
    $check_existing->close();
    
    // Check if user has already suggested this sport
    $stmt = $conn->prepare("SELECT report_id FROM reports WHERE username = ? AND type = 'suggest_sport' AND suggested_sport_name = ?");
    $stmt->bind_param("ss", $username, $sport_name);
    $stmt->execute();
    $result = $stmt->get_result();
    $already_suggested = $result->num_rows > 0;
    $stmt->close();
    
    echo json_encode([
        "success" => true, 
        "already_exists" => $already_exists,
        "already_suggested" => $already_suggested
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "❌ Invalid request method."]);
?> 