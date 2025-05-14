// Run when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {

  const form = document.getElementById('loginForm'); // Get the login form

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Stop default form submission
    const identifier = form.querySelector('input[name="username"]').value; // Get username
    const password = form.querySelector('input[name="password"]').value;   // Get password
    const errorMessage = document.getElementById('errorMessage');          // Error message element
    errorMessage.textContent = '⏳ Verifying...';                           // Show loading message

    const formData = new FormData();       // Create form data object
    formData.append('username', identifier); // Add username to form data
    formData.append('password', password);   // Add password to form data

    // Send form data to server using fetch
    fetch('login_process.php', {
      method: 'POST',          // Use POST method
      body: formData,          // Attach form data
    })
      .then((res) => res.json()) // Convert response to JSON
      .then((data) => {
        if (data.success) {
          window.location.href = data.redirect; // Redirect on success
        } else {
          errorMessage.textContent = data.message; // Show error message
        }
      })
      .catch((err) => {
        errorMessage.textContent = '❌ Login error occurred, please try again.'; // Handle fetch error
        console.error(err); // Log error to console
      });
  });

});
