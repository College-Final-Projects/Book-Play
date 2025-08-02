<?php
// Get current page name to highlight active nav item
$current_page = basename($_SERVER['PHP_SELF'], '.php');
?>
<!-- navbar.html -->
<nav class="fresh-navbar">
  <div class="logo">Book&Play</div>
  <div class="nav-wrapper">
    <ul class="nav-links">
      <li><a href="../HomePage/HomePage.php" <?php echo ($current_page == 'HomePage') ? 'class="active"' : ''; ?>>Home Page</a></li>
      <li><a href="../FindPlayer/FindPlayer.php" <?php echo ($current_page == 'FindPlayer') ? 'class="active"' : ''; ?>>Find Player</a></li>
      <li><a href="../JoinGroup/JoinGroup.php" <?php echo ($current_page == 'JoinGroup') ? 'class="active"' : ''; ?>>Join Group</a></li>
      <li><a href="../BookVenue/BookVenue.php" <?php echo ($current_page == 'BookVenue') ? 'class="active"' : ''; ?>>Book Venue</a></li>
      <li><a href="../Favorites/Favorites.php" <?php echo ($current_page == 'Favorites') ? 'class="active"' : ''; ?>>My Favorites</a></li>
      <li><a href="../Chats/Chats.php" <?php echo ($current_page == 'Chats') ? 'class="active"' : ''; ?>>My Chats</a></li>
      <li><a href="../MyBookings/MyBookings.php" <?php echo ($current_page == 'MyBookings') ? 'class="active"' : ''; ?>>My Bookings</a></li>
      <li><a href="../../Login_Page/Login.php" class="logout">Logout</a></li>
    </ul>
  </div>
</nav>
