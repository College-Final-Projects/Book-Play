<?php
/**
 * Header Bar Component
 * 
 * This component provides a consistent header bar across all pages with:
 * - Logo/title display
 * - Navigation menu (if navbar.php is included)
 * - User profile section with dropdown menu
 * 
 * Required variables (optional):
 * - $profileImagePath: Custom path for user profile image
 * - $editProfilePath: Custom path for edit profile link
 * - $logoutPath: Custom path for logout link
 * - $isAdmin: Set to true for admin pages to show admin navbar
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */
?>
<!-- Main header container with logo and navigation -->
<div class="header-bar">
  <!-- Application logo/title -->
  <div class="logo-title">BOOK&PLAY</div>
  
  <!-- Include navigation menu component -->
  <?php include 'navbar.php'; ?>
  
  <!-- User profile section with dropdown menu -->
  <div class="profile-container" onclick="toggleProfileMenu()">
    <!-- Username display (populated by JavaScript) -->
    <span id="usernameDisplay" class="username-display"></span>
    
    <!-- User profile image with fallback to default -->
    <img
      id="userProfileImage"
      class="profile-icon"
      src="<?php echo isset($profileImagePath) ? $profileImagePath : '../../../uploads/users/default.jpg'; ?>"
      alt="Profile Image"
    />
    
    <!-- Profile dropdown menu -->
    <div class="profile-menu" id="profileMenu">
      <a href="<?php echo isset($editProfilePath) ? $editProfilePath : '../../../auth/EditProfile/EditProfile.php'; ?>">Edit Profile</a>
      <a href="<?php echo isset($logoutPath) ? $logoutPath : '../../../logout.php'; ?>">Logout</a>
    </div>
  </div>
</div> 