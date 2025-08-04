<?php
/**
 * Facility Owner Navbar Component
 * للـ Facility Owner فقط مع شروط تحديد الصفحة النشطة
 */

// الحصول على اسم الصفحة الحالية
$current_page = basename($_SERVER['PHP_SELF'], '.php');
$current_folder = basename(dirname($_SERVER['PHP_SELF']));

// تحديد الصفحة النشطة بناءً على الشروط
$active_page = '';

if ($current_page == 'HomePage' || $current_folder == 'HomePage') {
    $active_page = 'HomePage';
} elseif ($current_page == 'ManageVenue' || $current_folder == 'ManageVenue') {
    $active_page = 'ManageVenue';
} elseif ($current_page == 'Bookings' || $current_folder == 'Bookings') {
    $active_page = 'Bookings';
} elseif ($current_page == 'Analytics' || $current_folder == 'Analytics') {
    $active_page = 'Analytics';
} elseif ($current_page == 'Messages' || $current_folder == 'Messages') {
    $active_page = 'Messages';
}

// Function to check if page is active
function isActive($pageName) {
    global $active_page;
    return ($active_page === $pageName) ? 'active' : '';
}
?>

<!-- Facility Owner Navbar -->
<link rel="stylesheet" href="../global.css">
<nav class="fresh-navbar">
    <div class="logo">Book<span>&</span>Play</div>
    <ul class="nav-links">
      <li><a href="../HomePage/HomePage.php" class="<?php echo isActive('HomePage'); ?>">HomePage</a></li>
      <li><a href="../ManageVenue/ManageVenue.php" class="<?php echo isActive('ManageVenue'); ?>">Manage Venue</a></li>
      <li><a href="../Bookings/Bookings.php" class="<?php echo isActive('Bookings'); ?>">Bookings</a></li>
      <li><a href="../Analytics/Analytics.php" class="<?php echo isActive('Analytics'); ?>">Analytics</a></li>
      <li><a href="../Messages/Messages.php" class="<?php echo isActive('Messages'); ?>">Messages</a></li>
      <li><a href="../../../logout.php" class="logout">Logout</a></li>
    </ul>
</nav>

<!-- Debug Information -->
<script>
console.log('=== FACILITY OWNER NAVBAR DEBUG ===');
console.log('Current Page:', '<?php echo $current_page; ?>');
console.log('Current Folder:', '<?php echo $current_folder; ?>');
console.log('Active Page:', '<?php echo $active_page; ?>');
</script>