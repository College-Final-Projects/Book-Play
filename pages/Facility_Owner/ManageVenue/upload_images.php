<?php
/**
 * Function to handle multiple image uploads for sport facilities
 * Allows uploading up to 3 images and stores them in the uploads/venues directory
 */
function upload_images($files) {
    // Define the upload directory path (server path)
    $upload_dir = __DIR__ . '/../../../uploads/venues/';

    error_log("Upload Images - Starting upload process");
    error_log("Upload Images - Upload directory: " . $upload_dir);
    error_log("Upload Images - Files received: " . json_encode($files));
    error_log("Upload Images - Directory exists: " . (file_exists($upload_dir) ? 'Yes' : 'No'));
    error_log("Upload Images - Directory writable: " . (is_writable($upload_dir) ? 'Yes' : 'No'));

    // Create the uploads directory if it doesn't exist
    if (!file_exists($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            error_log("Failed to create upload directory: " . $upload_dir);
            return [];
        }
        error_log("Upload Images - Created upload directory: " . $upload_dir);
    }
    
    // Ensure directory is writable (Windows fix)
    if (!is_writable($upload_dir)) {
        chmod($upload_dir, 0777);
        error_log("Upload Images - Set directory permissions to 0777");
    }

    $uploaded_files = [];
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
    $max_size = 5 * 1024 * 1024; // 5MB

    $file_count = min(count($files['name']), 3); // Limit to 3 files
    error_log("Upload Images - Processing $file_count files");

    for ($i = 0; $i < $file_count; $i++) {
        error_log("Upload Images - Processing file $i: " . $files['name'][$i]);
        
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            error_log("File upload error for file $i: " . $files['error'][$i]);
            continue;
        }

        $file_type = $files['type'][$i];
        if (!in_array($file_type, $allowed_types)) {
            error_log("Invalid file type for file $i: " . $file_type);
            continue;
        }

        if ($files['size'][$i] > $max_size) {
            error_log("File too large for file $i: " . $files['size'][$i]);
            continue;
        }

        $new_filename = uniqid() . '_' . basename($files['name'][$i]);
        $destination = $upload_dir . $new_filename;
        
        error_log("Upload Images - Moving file to: " . $destination);
        error_log("Upload Images - Source temp file: " . $files['tmp_name'][$i]);
        error_log("Upload Images - Source temp file exists: " . (file_exists($files['tmp_name'][$i]) ? 'Yes' : 'No'));
        error_log("Upload Images - Destination directory writable: " . (is_writable(dirname($destination)) ? 'Yes' : 'No'));

        if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
            // Store only the filename for database storage
            $uploaded_files[] = $new_filename;
            error_log("Upload Images - Successfully uploaded: " . $new_filename);
            error_log("Upload Images - Final file exists at destination: " . (file_exists($destination) ? 'Yes' : 'No'));
        } else {
            error_log("Failed to move uploaded file: " . $files['tmp_name'][$i] . " to " . $destination);
            error_log("Upload Images - Last PHP error: " . error_get_last()['message']);
        }
    }

    error_log("Upload Images - Final result: " . json_encode($uploaded_files));
    return $uploaded_files;
}
?>
