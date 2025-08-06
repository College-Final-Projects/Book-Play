<?php
/**
 * Admin Navbar Component
 * For Admin only with conditions to determine active page
 */

// Get current page name
$current_page = basename($_SERVER['PHP_SELF'], '.php');
$current_folder = basename(dirname($_SERVER['PHP_SELF']));

// Determine active page based on conditions
$active_page = '';

if ($current_page == 'HomePage' || $current_folder == 'HomePage') {
    $active_page = 'HomePage';
} elseif ($current_page == 'ManageVenueRequests' || $current_folder == 'ManageVenueRequests') {
    $active_page = 'ManageVenueRequests';
} elseif ($current_page == 'MangeSports' || $current_folder == 'MangeSports') {
    $active_page = 'MangeSports';
} elseif ($current_page == 'ReviewComplaints' || $current_folder == 'ReviewComplaints') {
    $active_page = 'ReviewComplaints';
}

// Function to check if page is active
function isActive($pageName) {
    global $active_page;
    return ($active_page === $pageName) ? 'active' : '';
}
?>

<!-- Admin Navbar -->
<link rel="stylesheet" href="../global.css">
<nav class="admin-navbar">
    <div class="nav-container">
        <h1 class="logo">Book&Play Admin Panel</h1>
        <ul class="nav-links">
            <li><a href="../HomePage/HomePage.php" class="<?php echo isActive('HomePage'); ?>">HomePage</a></li>
            <li><a href="../ManageVenueRequests/ManageVenueRequests.php" class="<?php echo isActive('ManageVenueRequests'); ?>">Manage Venue Requests</a></li>
            <li><a href="../MangeSports/MangeSports.php" class="<?php echo isActive('MangeSports'); ?>">Manage Sports</a></li>
            <li><a href="../ReviewComplaints/ReviewComplaints.php" class="<?php echo isActive('ReviewComplaints'); ?>">Review Complaints</a></li>
            <li><a href="../../../logout.php" class="logout">Logout</a></li>
        </ul>
    </div>
</nav>

<!-- Debug Information -->
<script>
console.log('=== ADMIN NAVBAR DEBUG ===');
console.log('Current Page:', '<?php echo $current_page; ?>');
console.log('Current Folder:', '<?php echo $current_folder; ?>');
console.log('Active Page:', '<?php echo $active_page; ?>');
</script>