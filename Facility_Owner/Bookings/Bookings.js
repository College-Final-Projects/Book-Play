// Minimal JavaScript - only toggle between views and handle simple UI interactions
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const venueCardsView = document.getElementById('venue-cards-view');
    const bookingDetailView = document.getElementById('booking-detail-view');
    const viewBookingButtons = document.querySelectorAll('.btn-view-bookings');
    const backToVenuesButton = document.querySelector('.btn-back-to-venues');
    const venueListItems = document.querySelectorAll('.venues-list li');
    const dateBtns = document.querySelectorAll('.date-btn');
    const venueTitle = document.querySelector('.booking-content .venue-details h2');
    const venueLocation = document.querySelector('.location-badge');
    const venueRating = document.querySelector('.rating-badge');
    const monthNavBtns = document.querySelectorAll('.month-nav');
    const currentMonth = document.querySelector('.current-month');


    // Toggle between views - from venue cards to booking details
    viewBookingButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            venueCardsView.classList.add('hidden');
            bookingDetailView.classList.remove('hidden');
            
            // Set active venue in sidebar
            venueListItems.forEach(item => item.classList.remove('active'));
            venueListItems[index].classList.add('active');
            
            // Update venue details
            updateVenueDetails(index);
        });
    });

    // Back to venues view
    backToVenuesButton.addEventListener('click', () => {
        bookingDetailView.classList.add('hidden');
        venueCardsView.classList.remove('hidden');
    });

    // Switch between venues in sidebar
    venueListItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            venueListItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            updateVenueDetails(index);
        });
    });

    // Toggle between dates
    dateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // In a real application, this would fetch bookings for the selected date
        });
    });

    // Month navigation
    let currentMonthIndex = 4; // May (0-indexed)
    const months = [
        'January', 'February', 'March', 'April', 'May', 
        'June', 'July', 'August', 'September', 'October', 
        'November', 'December'
    ];

    monthNavBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Previous month button
            if (index === 0 && currentMonthIndex > 0) {
                currentMonthIndex--;
            }
            // Next month button
            else if (index === 1 && currentMonthIndex < 11) {
                currentMonthIndex++;
            }
            
            currentMonth.textContent = `${months[currentMonthIndex]} 2025`;
        });
    });

    // Update venue details in booking view
    function updateVenueDetails(index) {
        const venue = venues[index];
        venueTitle.textContent = venue.name;
        venueLocation.textContent = venue.location;
        venueRating.textContent = venue.rating;
    }

    // Message button functionality
    const messageButtons = document.querySelectorAll('.btn-send-message');
    messageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // In a real application, this would open a message dialog
            alert('Message feature would open here');
        });
    });
});
const modal = document.getElementById('addBookingModal');

  // When user clicks Add Booking button
  document.querySelector('.btn-add-booking').addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  // Close modal
  function closeModal() {
    modal.style.display = 'none';
  }

  // Optional: Prevent form from reloading page
  document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Booking added (mock only)');
    closeModal();
  });