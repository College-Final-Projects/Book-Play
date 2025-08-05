<?php
/**
 * User Registration Verification Handler
 * 
 * This file handles the multi-step user registration verification process:
 * 1. Email verification code validation
 * 2. User profile creation with sports preferences
 * 3. Image upload handling
 * 4. Database insertion and session cleanup
 * 
 * Features:
 * - Email verification code checking
 * - Sports list generation for user preferences
 * - Profile image upload and storage
 * - User data validation and database insertion
 * - Favorite sports association
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Start session and include database connection
session_start(); // Start PHP session for user tracking across requests
require_once '../../../db.php'; // Include database connection file

/**
 * Generate sports list HTML from database
 * Creates checkbox options for all accepted sports
 * 
 * @return string HTML string containing sport options
 */
function getSportsHTML() {
    global $conn; // Use the global $conn variable for DB connection

    $sportsHTML = ''; // Initialize the variable that will store the HTML

    // Query to get accepted sports from database
    $result = $conn->query("SELECT * FROM `sports` WHERE is_Accepted = 1");

    if ($result->num_rows > 0) { // If there are sports returned from DB
        while ($row = $result->fetch_assoc()) { // Loop through each sport
            $sportId = $row['sport_id']; // Get the sport's ID
            $sport = htmlspecialchars($row['sport_name']); // Escape special characters for safe HTML output

            $sportsHTML .= "<div class='sport-option'>"; // Start sport option container
            $sportsHTML .= "<input type='checkbox' id='sport-$sportId' name='favorite_sports[]' value='$sportId'>"; // Add checkbox input
            $sportsHTML .= "<label for='sport-$sportId' class='sport-label'>$sport</label>"; // Label for the checkbox
            $sportsHTML .= "</div>"; // Close sport option container
        }
    } else {
        $sportsHTML = "<p>No sports available</p>"; // Show message if no sports available
    }

    return $sportsHTML; // Return the full HTML string
}

/**
 * Handle GET request for sports list
 * Returns HTML options for sports selection in registration form
 */
if (isset($_GET['get_sports']) && $_GET['get_sports'] == 1) {
    echo getSportsHTML(); // Output the generated sports HTML
    exit(); // Terminate script to prevent further execution
}

// Set header for JSON response for all POST requests
header('Content-Type: application/json'); // Response type is JSON

/**
 * Verify email verification code (Step 2 of registration)
 * Validates the 6-digit code sent to user's email
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['code']) && !isset($_POST['username'])) {
    $code = $_POST['code']; // Get the code from the request

    // Compare submitted code with stored session code
    if (!isset($_SESSION['verification_code']) || $code != $_SESSION['verification_code']) {
        echo json_encode([
            "status" => "error",
            "message" => "❌ Incorrect verification code."
        ]);
        exit(); // Stop script if invalid code
    }

    // Code is correct - proceed to profile creation
    echo json_encode(["status" => "success"]);
    exit(); // Terminate script
}

/**
 * Handle profile form submission (Step 3 of registration)
 * Creates user profile with personal information and sports preferences
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    // Extract form data with fallback values
    $username     = $_POST['username'] ?? ''; // Get username
    $firstName    = $_POST['firstName'] ?? ''; // Get first name
    $lastName     = $_POST['lastName'] ?? ''; // Get last name
    $age          = intval($_POST['age'] ?? 0); // Get age as integer
    $gender       = $_POST['gender'] ?? ''; // Get gender
    $phone        = $_POST['phone'] ?? ''; // Get phone number
    $description  = $_POST['description'] ?? ''; // Get description
    $userImage    = $_FILES['user_image'] ?? null; // Get uploaded image if exists
    $favoriteSports = isset($_POST['favorite_sports']) ? $_POST['favorite_sports'] : []; // Get favorite sports

    // Validate session data exists (email and password from step 1)
    if (!isset($_SESSION['temp_email']) || !isset($_SESSION['temp_password'])) {
        echo json_encode(["status" => "error", "message" => "⏳ Session expired. Please try again."]);
        exit(); // Exit if session data is missing
    }

    // Retrieve stored email and password from session
    $email = $_SESSION['temp_email']; // Retrieve stored email
    $password = $_SESSION['temp_password']; // Retrieve stored password

    // Check if username already exists in database
    $checkUser = $conn->prepare("SELECT username FROM users WHERE username = ?");
    $checkUser->bind_param("s", $username); // Bind username to query
    $checkUser->execute(); // Execute the query
    $checkUser->store_result(); // Store the result to check row count

    if ($checkUser->num_rows > 0) { // If username is already taken
        echo json_encode(["status" => "error", "message" => "❌ Username already exists."]);
        exit(); // Exit script
    }
    $checkUser->close(); // Close statement

    /**
     * Handle profile image upload
     * Processes uploaded image file and stores it in uploads directory
     */
    $userImagePath = null; // Default to null
    if ($userImage && $userImage['tmp_name']) { // If file uploaded
        $targetDir = "../../../uploads/users/"; // Directory to store uploads
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0755, true); // Create directory if not exists
        }
        $filename = uniqid() . "_" . basename($userImage["name"]); // Generate unique file name
        $targetFile = $targetDir . $filename; // Full path to save image

        if (move_uploaded_file($userImage["tmp_name"], $targetFile)) { // Move uploaded file
            $userImagePath = $filename; // Save file name for DB
        }
    }

    // Check if username already exists
$stmt = $conn->prepare("SELECT username FROM users WHERE username = ?");
$stmt->bind_param("s", $_POST['username']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "❌ Username already exists. Please choose another one."
    ]);
    exit;
}


    // 💾 Insert user data into 'users' table
    $stmt = $conn->prepare("INSERT INTO users (username, email, first_name, last_name, password, description, age, gender, phone_number, user_image)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssisss", $username, $email, $firstName, $lastName, $password, $description, $age, $gender, $phone, $userImagePath); // Bind values

    if ($stmt->execute()) { // If insert successful
        $userId = $conn->insert_id; // Get inserted user ID

        // ➕ Insert favorite sports into 'user_favorite_sports'
        if (!empty($favoriteSports)) {
            $sportInsertStmt = $conn->prepare("INSERT INTO user_favorite_sports (username, sport_id) VALUES (?, ?)");
            foreach ($favoriteSports as $sportId) {
                $sportInsertStmt->bind_param("si", $username, $sportId); // Bind sport
                $sportInsertStmt->execute(); // Execute insert
            }
            $sportInsertStmt->close(); // Close statement
        }

        // 🧹 Clean session after successful registration
        unset($_SESSION['temp_email'], $_SESSION['temp_password'], $_SESSION['verification_code']);

        echo json_encode([
            "status" => "success",
            "message" => "✅ Profile created successfully.",
            "redirect" => "../../../index.php" // Redirect user to homepage
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "❌ Failed to save user: " . $conn->error]); // Error inserting
    }

    $stmt->close(); // Close insert statement
    $conn->close(); // Close DB connection
    exit(); // End script
}

// ❌ If none of the above conditions are met, return method error
echo json_encode(["status" => "error", "message" => "⛔ Invalid request method."]); // Return generic error
exit(); // Exit script
?>