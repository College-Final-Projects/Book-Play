<?php
/**
 * Database Configuration and Connection
 * 
 * This file handles the database connection configuration for the BOOK-PLAY application.
 * It establishes a connection to the MySQL database using mysqli.
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

// Database connection parameters
$host = "127.0.0.1:3307";  // Local MySQL server with custom port
$db_user = "root";         // Database username
$db_pass = "";             // Database password (empty for local development)
$db_name = "bookplay";     // Database name
$port = 3307;              // MySQL port number

// Create new mysqli connection
$conn = new mysqli($host, $db_user, $db_pass, $db_name, $port);

// Check connection status and handle errors
if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
}