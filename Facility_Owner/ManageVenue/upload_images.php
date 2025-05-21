<?php
/**
 * Function to handle multiple image uploads for sport facilities
 * Allows uploading up to 3 images and stores them in the uploads/venues directory
 */
function upload_images($files) {
    // Define the upload directory path (server path)
    $upload_dir = '../../uploads/venues/';

    // Public URL path to return (relative to web root)
    $public_path = '../uploads/venues/';

    // Create the uploads directory if it doesn't exist
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $uploaded_files = [];
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
    $max_size = 5 * 1024 * 1024; // 5MB

    $file_count = min(count($files['name']), 3); // Limit to 3 files

    for ($i = 0; $i < $file_count; $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            continue;
        }

        $file_type = $files['type'][$i];
        if (!in_array($file_type, $allowed_types)) {
            continue;
        }

        if ($files['size'][$i] > $max_size) {
            continue;
        }

        $new_filename = uniqid() . '_' . basename($files['name'][$i]);
        $destination = $upload_dir . $new_filename;

        if (move_uploaded_file($files['tmp_name'][$i], $destination)) {
            // ✅ Store relative web path, not full server path
            $uploaded_files[] = $public_path . $new_filename;
        }
    }

    return $uploaded_files;
}
?>
