// ================== START: User Selection Script ==================

// Wait for the DOM to be fully loaded
// DOMContentLoaded ensures the script runs after HTML is ready
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus(); // Call function to check if the user is an admin
});

// Function to check if the user is an admin
function checkAdminStatus() {
    const xhr = new XMLHttpRequest(); // Create a new AJAX request
    xhr.open('GET', 'is_admin.php', true); // Send GET request to backend

    // When the response is received
    xhr.onload = function() {
        if (this.status === 200) { // Check if request was successful
            const response = JSON.parse(this.responseText); // Parse JSON response
            const adminCard = document.getElementById('admin'); // Get the admin card div

            if (response.is_admin === 1) {
                adminCard.style.display = 'block'; // Show admin card if user is admin
            } else {
                adminCard.style.display = 'none'; // Hide it otherwise
            }
        }
    };

    // Handle request error
    xhr.onerror = function() {
        console.error('Request error'); // Log error
    };

    xhr.send(); // Send the AJAX request
}

// ================== END: User Selection Script ==================
