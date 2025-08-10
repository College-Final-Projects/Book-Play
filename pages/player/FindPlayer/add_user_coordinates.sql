-- Add latitude and longitude columns to users table for geolocation
ALTER TABLE users 
ADD COLUMN latitude DOUBLE(10,6) DEFAULT NULL,
ADD COLUMN longitude DOUBLE(10,6) DEFAULT NULL;

-- Add index for better performance on location-based queries
ALTER TABLE users 
ADD INDEX idx_location (latitude, longitude);
