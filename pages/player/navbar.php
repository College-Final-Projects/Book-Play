<?php
/**
 * Player Navbar Component
 * For Player only with active page conditions
 */

$current_page = basename($_SERVER['PHP_SELF'], '.php');
$current_folder = basename(dirname($_SERVER['PHP_SELF']));

// Determine active page based on conditions
$active_page = '';

if ($current_page == 'HomePage' || $current_folder == 'HomePage') {
    $active_page = 'HomePage';
} elseif ($current_page == 'FindPlayer' || $current_folder == 'FindPlayer') {
    $active_page = 'FindPlayer';
} elseif ($current_page == 'JoinGroup' || $current_folder == 'JoinGroup') {
    $active_page = 'JoinGroup';
} elseif ($current_page == 'BookVenue' || $current_folder == 'BookVenue') {
    $active_page = 'BookVenue';
} elseif ($current_page == 'Favorites' || $current_folder == 'Favorites') {
    $active_page = 'Favorites';
} elseif ($current_page == 'Chats' || $current_folder == 'Chats') {
    $active_page = 'Chats';
} elseif ($current_page == 'MyBookings' || $current_folder == 'MyBookings') {
    $active_page = 'MyBookings';
}

// Function to check if page is active
function isActive($pageName) {
    global $active_page;
    return ($active_page === $pageName) ? 'active' : '';
}
?>

<!-- Player Navbar -->
<link rel="stylesheet" href="../global.css">
<nav class="fresh-navbar">
    <div class="logo">Book&Play</div>
    <div class="nav-wrapper">
        <ul class="nav-links">
            <li><a href="../HomePage/HomePage.php" class="<?php echo isActive('HomePage'); ?>">Home Page</a></li>
            <li><a href="../FindPlayer/FindPlayer.php" class="<?php echo isActive('FindPlayer'); ?>">Find Player</a></li>
            <li><a href="../JoinGroup/JoinGroup.php" class="<?php echo isActive('JoinGroup'); ?>">Join Group</a></li>
            <li><a href="../BookVenue/BookVenue.php" class="<?php echo isActive('BookVenue'); ?>">Book Venue</a></li>
            <li><a href="../Favorites/Favorites.php" class="<?php echo isActive('Favorites'); ?>">My Favorites</a></li>
            <li><a href="../Chats/Chats.php" class="<?php echo isActive('Chats'); ?>">My Chats</a></li>
            <li><a href="../MyBookings/MyBookings.php" class="<?php echo isActive('MyBookings'); ?>">My Bookings</a></li>
            <li><a href="../MyFriends/MyFriends.php" class="<?php echo isActive('MyFriends'); ?>">My Friends</a></li>
            <li><a href="../../auth/Login_Page/Login.php" class="logout">Logout</a></li>
        </ul>
    </div>
</nav>

<!-- Debug Information -->
<script>
console.log('=== PLAYER NAVBAR DEBUG ===');
console.log('Current Page:', '<?php echo $current_page; ?>');
console.log('Current Folder:', '<?php echo $current_folder; ?>');
console.log('Active Page:', '<?php echo $active_page; ?>');
</script>