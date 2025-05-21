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
