-- Create venue_reports table for storing venue reports
CREATE TABLE IF NOT EXISTS `venue_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `facilities_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `details` text,
  `report_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `facilities_id` (`facilities_id`),
  KEY `username` (`username`),
  UNIQUE KEY `unique_report` (`facilities_id`, `username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 