-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Aug 03, 2025 at 10:49 AM
-- Server version: 11.5.2-MariaDB
-- PHP Version: 8.4.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bookplay`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `booking_id` int(11) NOT NULL AUTO_INCREMENT,
  `facilities_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `Total_Price` int(11) NOT NULL,
  `Paid` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`booking_id`),
  KEY `facilities_id` (`facilities_id`),
  KEY `username` (`username`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `facilityinsights`
--

DROP TABLE IF EXISTS `facilityinsights`;
CREATE TABLE IF NOT EXISTS `facilityinsights` (
  `insight_id` int(11) NOT NULL AUTO_INCREMENT,
  `facilities_id` int(11) NOT NULL,
  `booking_day` int(11) NOT NULL CHECK (`booking_day` between 1 and 31),
  `booking_month` int(11) NOT NULL CHECK (`booking_month` between 1 and 12),
  `booking_year` int(11) NOT NULL,
  `total_bookings` int(11) DEFAULT 0,
  PRIMARY KEY (`insight_id`),
  KEY `facilities_id` (`facilities_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
CREATE TABLE IF NOT EXISTS `friends` (
  `user1` varchar(50) NOT NULL,
  `user2` varchar(50) NOT NULL,
  PRIMARY KEY (`user1`,`user2`),
  KEY `user2` (`user2`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
CREATE TABLE IF NOT EXISTS `groups` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  `facilities_id` int(11) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `max_members` int(11) NOT NULL DEFAULT 10,
  `booking_id` int(11) DEFAULT NULL,
  `privacy` enum('public','private') DEFAULT 'public',
  `group_password` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`group_id`),
  KEY `created_by` (`created_by`),
  KEY `facilities_id` (`facilities_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
CREATE TABLE IF NOT EXISTS `group_members` (
  `group_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `payment_amount` decimal(10,0) NOT NULL DEFAULT 0,
  `required_payment` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`group_id`,`username`),
  KEY `username` (`username`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `invoice_date` datetime DEFAULT current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('unpaid','paid','cancelled') DEFAULT 'unpaid',
  PRIMARY KEY (`invoice_id`),
  KEY `username` (`username`),
  KEY `payment_id` (`payment_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_username` varchar(50) DEFAULT NULL,
  `receiver_username` varchar(50) DEFAULT NULL,
  `message_text` text DEFAULT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`),
  KEY `sender_username` (`sender_username`),
  KEY `receiver_username` (`receiver_username`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `owner`
--

DROP TABLE IF EXISTS `owner`;
CREATE TABLE IF NOT EXISTS `owner` (
  `owner_email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`owner_email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('credit_card','paypal') DEFAULT 'credit_card',
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `payment_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `username` (`username`),
  KEY `booking_id` (`booking_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
CREATE TABLE IF NOT EXISTS `ratings` (
  `rating_id` int(11) NOT NULL AUTO_INCREMENT,
  `facilities_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `rating_value` int(11) DEFAULT NULL CHECK (`rating_value` between 1 and 5),
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`rating_id`),
  KEY `facilities_id` (`facilities_id`),
  KEY `username` (`username`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `type` enum('report_place','suggest_sport','suggest_place','admin_request') NOT NULL,
  `facilities_id` int(11) DEFAULT NULL,
  `suggested_sport_name` varchar(100) DEFAULT NULL,
  `suggested_place_name` varchar(100) DEFAULT NULL,
  `Reason` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`report_id`),
  KEY `username` (`username`),
  KEY `facilities_id` (`facilities_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sportfacilities`
--

DROP TABLE IF EXISTS `sportfacilities`;
CREATE TABLE IF NOT EXISTS `sportfacilities` (
  `facilities_id` int(11) NOT NULL AUTO_INCREMENT,
  `place_name` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `owner_username` varchar(50) DEFAULT NULL,
  `SportCategory` varchar(50) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `is_Accepted` tinyint(1) DEFAULT 0,
  `is_available` tinyint(1) NOT NULL DEFAULT 0,
  `latitude` double(10,6) DEFAULT NULL,
  `longitude` double(10,6) DEFAULT NULL,
  PRIMARY KEY (`facilities_id`),
  KEY `owner_username` (`owner_username`),
  KEY `SportCategory` (`SportCategory`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sports`
--

DROP TABLE IF EXISTS `sports`;
CREATE TABLE IF NOT EXISTS `sports` (
  `sport_id` int(11) NOT NULL AUTO_INCREMENT,
  `sport_name` varchar(100) NOT NULL,
  `is_Accepted` tinyint(1) NOT NULL,
  PRIMARY KEY (`sport_id`),
  UNIQUE KEY `sport_name` (`sport_name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `Gender` varchar(50) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `user_image` text DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_favorite_facilities`
--

DROP TABLE IF EXISTS `user_favorite_facilities`;
CREATE TABLE IF NOT EXISTS `user_favorite_facilities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `facility_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`facility_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_favorite_sports`
--

DROP TABLE IF EXISTS `user_favorite_sports`;
CREATE TABLE IF NOT EXISTS `user_favorite_sports` (
  `username` varchar(50) NOT NULL,
  `sport_id` int(11) NOT NULL,
  PRIMARY KEY (`username`,`sport_id`),
  KEY `sport_id` (`sport_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;
COMMIT;

-- --------------------------------------------------------

--
-- Table structure for table `user_availability`
--

DROP TABLE IF EXISTS `user_availability`;
CREATE TABLE IF NOT EXISTS `user_availability` (
  `username` varchar(50) NOT NULL,
  `day_of_week` int(1) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`username`, `day_of_week`, `start_time`),
  KEY `day_of_week` (`day_of_week`),
  FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON DELETE CASCADE
) ENGINE=MyISAM DEFAULT CHARSET=utf16 COLLATE=utf16_general_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
