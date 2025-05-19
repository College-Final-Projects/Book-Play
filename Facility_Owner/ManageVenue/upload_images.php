<?php
/**
 * Function to handle multiple image uploads for sport facilities
 * Allows uploading up to 3 images and stores them in the uploads/venues directory
 */
function upload_images($files) {
    // Define the upload directory path
    $upload_dir = '../../uploads/venues/';
    
    // Check if the directory exists, if not, create it with full permissions
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Initialize an array to store uploaded file paths
    $uploaded_files = [];
    
    // Define allowed image file types
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
    
    // Set maximum file size to 5MB (5 * 1024 * 1024 bytes)
    $max_size = 5 * 1024 * 1024;
    
    // Count how many files were uploaded
    $file_count = count($files['name']);
    
    // Limit the number of files to 3 maximum
    $file_count = min($file_count, 3);
    
    // Loop through each uploaded file
    for ($i = 0; $i < $file_count; $i++) {
        // Skip any file that has an upload error
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }
        
        // Get the file's MIME type
        $file_type = $files['type'][$i];
        
        // Skip file if its type is not in the allowed types list
        if (!in_array($file_type, $allowed_types)) {
            continue;
        }
        
        // Skip file if it exceeds the maximum size
        if ($files['size'][$i] > $max_size) {
            continue;
        }
        
        // Get the file extension from the original filename
        $file_extension = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
        
        // Create a unique filename with the original name to avoid conflicts
        $new_filename = uniqid() . '_' . $files['name'][$i];
        
        // Create the complete destination path
        $destination = $upload_dir . $new_filename;
        
        // Move the uploaded file from temporary location to our uploads directory
        if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
            // If successfully moved, add the path to our uploaded files array
            $uploaded_files[] = $destination;
        }
    }
    
    // Return an array of all successfully uploaded file paths
    return $uploaded_files;
}
?>