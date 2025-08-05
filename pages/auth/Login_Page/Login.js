/**
 * Login Page JavaScript
 * 
 * This file handles the client-side login form functionality including:
 * - Form submission handling
 * - AJAX authentication requests
 * - Error message display
 * - Success redirects
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */

/**
 * Initialize login form functionality when DOM is loaded
 * Sets up form submission handler and AJAX authentication
 */
document.addEventListener('DOMContentLoaded', function () {
  // Get login form element
  const form = document.getElementById('loginForm');

  /**
   * Handle form submission with AJAX
   * Prevents default form submission and sends data via fetch API
   */
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission
    
    // Get form input values
    const identifier = form.querySelector('input[name="username"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading message
    errorMessage.textContent = '⏳ Verifying...';

    // Prepare form data for submission
    const formData = new FormData();
    formData.append('username', identifier);
    formData.append('password', password);

    // Send authentication request to server
    fetch('login_process.php', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json()) // Parse JSON response
      .then((data) => {
        if (data.success) {
          // Redirect to appropriate dashboard on success
          window.location.href = data.redirect;
        } else {
          // Display error message on failure
          errorMessage.textContent = data.message;
        }
      })
      .catch((err) => {
        // Handle network or server errors
        errorMessage.textContent = '❌ Login error occurred, please try again.';
        console.error(err);
      });
  });
});
