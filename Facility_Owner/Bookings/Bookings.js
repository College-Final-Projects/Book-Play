document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Get all "View Bookings" buttons
    var viewBookingButtons = document.querySelectorAll('.btn-view-bookings');
    console.log('Found ' + viewBookingButtons.length + ' view booking buttons');
    
    // Get the views that need to be toggled
    var venuesContainer = document.querySelector('.venues-container');
    var bookingDetailView = document.getElementById('booking-detail-view');
    
    if (!venuesContainer) {
        console.error('Venues container not found!');
    }
    
    if (!bookingDetailView) {
        console.error('Booking detail view not found!');
    }
    
    // Add click event to each View Bookings button
    viewBookingButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            console.log('View Bookings button clicked');
            
            // Hide the venues container
            if (venuesContainer) {
                venuesContainer.style.display = 'none';
            }
            
            // Show the booking detail view
            if (bookingDetailView) {
                bookingDetailView.style.display = 'block';
                bookingDetailView.classList.remove('hidden');
            }
        });
    });
    
    // Back to Venues button
    var backButton = document.querySelector('.btn-back-to-venues');
    if (backButton) {
        backButton.addEventListener('click', function() {
            console.log('Back to venues button clicked');
            
            // Show the venues container
            if (venuesContainer) {
                venuesContainer.style.display = 'flex';
            }
            
            // Hide the booking detail view
            if (bookingDetailView) {
                bookingDetailView.style.display = 'none';
                bookingDetailView.classList.add('hidden');
            }
        });
    } else {
        console.error('Back button not found!');
    }
    
    // Modal functionality
    var addBookingBtn = document.querySelector('.btn-add-booking');
    var addBookingModal = document.getElementById('addBookingModal');
    var cancelBtn = document.querySelector('.btn-cancel');
    
    console.log('Add Booking Button:', addBookingBtn);
    console.log('Modal:', addBookingModal);
    console.log('Cancel Button:', cancelBtn);
    
    // Function to open modal
    function openModal() {
        console.log('Opening modal');
        if (addBookingModal) {
            addBookingModal.style.display = 'flex';
        }
    }
    
    // Function to close modal
    function closeModal() {
        console.log('Closing modal');
        if (addBookingModal) {
            addBookingModal.style.display = 'none';
        }
    }
    
    // Add booking button click
    if (addBookingBtn) {
        addBookingBtn.onclick = function() {
            openModal();
        };
    }
    
    // Cancel button click
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            closeModal();
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === addBookingModal) {
            closeModal();
        }
    };
    
    // Form submission handling
    var bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.onsubmit = function(e) {
            e.preventDefault();
            alert('Booking added successfully!');
            closeModal();
        };
    }
    
    // Venue sidebar functionality
    var venueListItems = document.querySelectorAll('.venues-list li');
    var venueTitle = document.querySelector('.booking-content .venue-details h2');
    var venueLocation = document.querySelector('.location-badge');
    var venueRating = document.querySelector('.rating-badge');
    
    // Venue details data
    var venues = [
        { name: 'Downtown Soccer Field', location: 'Central District', rating: '★ 4.8' },
        { name: 'Riverside Tennis Court', location: 'North District', rating: '★ 4.5' },
        { name: 'Lakeside Basketball Court', location: 'South District', rating: '★ 4.2' }
    ];
    
    // Add click handlers to venue list items
    venueListItems.forEach(function(item, index) {
        item.addEventListener('click', function() {
            // Update active state
            venueListItems.forEach(function(li) {
                li.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update venue details
            if (venues[index]) {
                var venue = venues[index];
                if (venueTitle) venueTitle.textContent = venue.name;
                if (venueLocation) venueLocation.textContent = venue.location;
                if (venueRating) venueRating.textContent = venue.rating;
            }
        });
    });
    
    // Date buttons
    var dateBtns = document.querySelectorAll('.date-btn');
    dateBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            dateBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        });
    });
    
    // Month navigation
    var monthNavBtns = document.querySelectorAll('.month-nav');
    var currentMonth = document.querySelector('.current-month');
    var monthIndex = 4; // May
    var months = [
        'January', 'February', 'March', 'April', 'May',
        'June', 'July', 'August', 'September', 'October',
        'November', 'December'
    ];
    
    monthNavBtns.forEach(function(btn, index) {
        btn.addEventListener('click', function() {
            if (index === 0 && monthIndex > 0) {
                monthIndex--;
            } else if (index === 1 && monthIndex < 11) {
                monthIndex++;
            }
            if (currentMonth) {
                currentMonth.textContent = months[monthIndex] + ' 2025';
            }
        });
    });
    
    // Send message buttons
    var messageButtons = document.querySelectorAll('.btn-send-message');
    messageButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            alert('Message feature would open here');
        });
    });
});