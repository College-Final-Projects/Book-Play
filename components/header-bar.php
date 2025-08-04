<?php
// Header component with profile menu
// Usage: include this file and set $profileImagePath, $editProfilePath, $logoutPath variables
// For admin pages: set $isAdmin = true to show admin navbar
?>
<div class="header-bar">
  <div class="logo-title">BOOK&PLAY</div>
  
  <!-- Include navbar component -->
  <?php include 'navbar.php'; ?>
  
  <div class="profile-container" onclick="toggleProfileMenu()">
    <span id="usernameDisplay" class="username-display"></span>
    <img
      id="userProfileImage"
      class="profile-icon"
      src="<?php echo isset($profileImagePath) ? $profileImagePath : '../../../uploads/users/default.jpg'; ?>"
      alt="Profile Image"
    />
    <div class="profile-menu" id="profileMenu">
      <a href="<?php echo isset($editProfilePath) ? $editProfilePath : '../../../auth/EditProfile/EditProfile.php'; ?>">Edit Profile</a>
      <a href="<?php echo isset($logoutPath) ? $logoutPath : '../../../logout.php'; ?>">Logout</a>
    </div>
  </div>
</div> 