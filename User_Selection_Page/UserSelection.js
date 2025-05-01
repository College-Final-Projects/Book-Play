// UserSelection.js - Handle admin card visibility based on user permissions

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin via AJAX call
    checkAdminStatus();
});

function checkAdminStatus() {
    // Create AJAX request to check admin status
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'is_admin.php', true);
    
    xhr.onload = function() {
        if (this.status === 200) {
            const response = JSON.parse(this.responseText);
            
            // Get admin card element
            const adminCard = document.getElementById('admin');
            
            // Show/hide admin card based on is_admin value
            if (response.is_admin === 1) {
                adminCard.style.display = 'block'; // Show admin card
            } else {
                adminCard.style.display = 'none';  // Hide admin card
            }
        }
    };
    
    xhr.onerror = function() {
        console.error('Request error');
    };
    
    xhr.send();
}