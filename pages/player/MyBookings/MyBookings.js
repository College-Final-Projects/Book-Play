document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    let allBookings = [];

    fetch('MyBookings.php?ajax=1')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('bookingsList');

            if (!data.success || !data.bookings.length) {
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">No bookings found</div>
                        <div class="empty-state-subtitle">You haven't made any bookings yet.</div>
                        <a href="../BookVenue/BookVenue.php" class="empty-state-btn">Explore Venues</a>
                    </div>`;
                return;
            }

            allBookings = data.bookings;
            renderBookings(allBookings);
        })
        .catch(error => {
            console.error('Error loading bookings:', error);
        });

    // Filter when typing
    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim();
        if (query === '') {
            renderBookings(allBookings);
        } else {
            const filtered = allBookings.filter(booking =>
                booking.booking_id.toString().startsWith(query)
            );
            renderBookings(filtered);
        }
    });

    function renderBookings(bookings) {
        const list = document.getElementById('bookingsList');
        if (!bookings.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-title">No results</div>
                    <div class="empty-state-subtitle">No bookings found with that ID.</div>
                </div>`;
            return;
        }

        list.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="venue-image">
                        <img src="../../../uploads/venues/${booking.image_url}" alt="${booking.place_name}">
                    </div>
                    <div class="booking-info">
                        <div class="venue-name">${booking.place_name}</div>
                        <div class="booking-details">
                            <div class="booking-detail">📅 ${formatDate(booking.booking_date)}</div>
                            <div class="booking-detail">⏰ ${booking.start_time} - ${booking.end_time}</div>
                            <div class="booking-detail">📍 ${booking.location ?? 'Location not available'}</div>
                            <div class="booking-detail">🆔 Booking ID: ${booking.booking_id}</div>
                        </div>
                    </div>
                    <div class="booking-price">₪${booking.Total_Price}</div>
                    <div class="booking-actions">
                        <button class="action-btn" onclick="viewBookingDetails(${booking.booking_id})">View Details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function formatDate(dateStr) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, options);
    }

    // Function to navigate to booking details page
    window.viewBookingDetails = function(bookingId) {
        if (!bookingId) {
            alert("Booking ID not available");
            return;
        }
        window.location.href = `../BookingDetails/BookingDetails.php?booking_id=${bookingId}`;
    };
});
