  function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('active');
  }

  // Close the menu when clicking outside
  document.addEventListener('click', function (e) {
    const profileContainer = document.querySelector('.profile-container');
    const menu = document.getElementById('profileMenu');
    if (!profileContainer.contains(e.target)) {
      menu.classList.remove('active');
    }
  });
document.addEventListener("DOMContentLoaded", () => {
  fetch("HomePage.php?action=get_user_image")
    .then((res) => res.json())
    .then((data) => {
      const imgElement = document.getElementById("userProfileImage");
      const usernameSpan = document.getElementById("usernameDisplay");
      if (imgElement && data.image) {
        imgElement.src = `../../uploads/users/${data.image}`;
      }
      if (usernameSpan && data.username) {
        usernameSpan.textContent = data.username;
      }
    })
    .catch((err) => {
      console.error("Failed to load user image or username", err);
    });
});
