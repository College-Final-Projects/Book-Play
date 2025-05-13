document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    const identifier = form.querySelector('input[name="username"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '⏳ Verifying...';

    const formData = new FormData();
    formData.append('username', identifier);
    formData.append('password', password);

    fetch('login_process.php', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.href = data.redirect;
        } else {
          errorMessage.textContent = data.message;
        }
      })
      .catch((err) => {
        errorMessage.textContent = '❌ Login error occurred, please try again.';
        console.error(err);
      });
  });
});