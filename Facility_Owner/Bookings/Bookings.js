document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const sportSelect = document.getElementById('sortSelectSport');
    const venuesContainer = document.querySelector('.venues-container');
    const bookingDetailView = document.getElementById('booking-detail-view');
    const venueCardsView = document.getElementById('venue-cards-view');
    const bookingForm = document.getElementById('bookingForm');

    let allBookings = [];
    let currentMonthIndex = 0;
    let globalCalendar = {};

    // Fetch venues data
    fetch("BookedFacilitiesFetch.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                venuesContainer.innerHTML = "";
                const venuesList = document.querySelector('.venues-list');
                venuesList.innerHTML = '';

                // Remove duplicates based on ID
                const uniqueVenues = [];
                const seenIds = new Set();

                data.venues.forEach(venue => {
                    if (seenIds.has(venue.id)) return;
                    seenIds.add(venue.id);
                    uniqueVenues.push(venue);
                });

                uniqueVenues.forEach(venue => {
                    const card = document.createElement("div");
                    card.className = "venue-card";

                    const ratingValue = parseFloat(venue.rating) || 0;
                    const fullStars = Math.floor(ratingValue);
                    const halfStar = (ratingValue - fullStars) >= 0.5 ? 1 : 0;
                    const emptyStars = 5 - fullStars - halfStar;
                    const starsHTML = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '✩'.repeat(emptyStars);

                    card.innerHTML = `
                        <div class="venue-header">
                            <div class="venue-rating">${starsHTML} (${venue.rating ?? 'N/A'})</div>
                        </div>
                        <img src="${venue.image}" class="venue-image" />
                        <h2 class="venue-name">${venue.name}</h2>
                        <p class="venue-location">${venue.location}</p>
                        <div class="venue-stats">
                            <div class="stat">
                                <span class="stat-label">Sport</span>
                                <span class="stat-value venue-sport">${venue.sport}</span>
                            </div>
                        </div>
                        <button class="btn-view-bookings">View Bookings</button>
                    `;
                    venuesContainer.appendChild(card);

                    const li = document.createElement('li');
                    li.textContent = venue.name;
                    li.dataset.venueId = venue.id;

                    const showBookings = () => {
                        venueCardsView.style.display = 'none';
                        bookingDetailView.classList.remove('hidden');

                        const venueTitle = document.querySelector('.booking-content .venue-details h2');
                        const venueLocation = document.querySelector('.location-badge');
                        const venueRating = document.querySelector('.rating-badge');

                        venueTitle.textContent = venue.name;
                        venueTitle.dataset.venueId = venue.id;
                        venueLocation.textContent = venue.location;
                        venueRating.textContent = `${starsHTML} (${venue.rating ?? 'N/A'})`;

                        fetch(`get_bookings.php?facilities_id=${venue.id}`)
                            .then(res => res.json())
                            .then(data => {
                                allBookings = data.bookings || [];
                                renderBookingsForDate('___EMPTY___'); // Initial display - empty table
                                
                                // Display calendar with date filtering functionality
                                if (data.calendar) {
                                    globalCalendar = data.calendar;
                                    currentMonthIndex = 0;
                                    renderCalendar(data.calendar);
                                }
                            });
                    };

                    card.querySelector('.btn-view-bookings').addEventListener('click', showBookings);
                    li.addEventListener('click', showBookings);
                    venuesList.appendChild(li);
                });
            }
        });

    // Render bookings for selected date or all bookings
    function renderBookingsForDate(selectedDate = null) {
        const tbody = document.querySelector('.bookings-table tbody');
        tbody.innerHTML = '';

        // Handle empty state explicitly
        if (selectedDate === '___EMPTY___') {
            tbody.innerHTML = '<tr><td colspan="4">Select a date to view bookings.</td></tr>';
            return;
        }

        const filtered = selectedDate
            ? allBookings.filter(b => b.date === selectedDate)
            : allBookings;

        if (filtered.length > 0) {
            filtered.forEach(b => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="user-column"><span>${b.username}</span></td>
                    <td>${b.players}</td>
                    <td>${b.time}</td>
                    <td><button class="btn-send-message" data-receiver="${b.username}">Send Message</button></td>
                `;
                tbody.appendChild(row);

                // Add event listener for send message button
                row.querySelector('.btn-send-message').addEventListener('click', function () {
                    const receiver = this.dataset.receiver;
                    document.getElementById('receiverInput').value = receiver;
                    document.getElementById('messageInput').value = '';
                    document.getElementById('messageModal').style.display = 'flex';
                });
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4">No bookings found for this date.</td></tr>';
        }
    }

    // Calendar rendering and navigation
    function renderCalendar(calendarData) {
        globalCalendar = calendarData;
        showMonth(currentMonthIndex);
    }

    function showMonth(index) {
        const container = document.getElementById('calendar-container');
        container.innerHTML = '';

        const monthNames = Object.keys(globalCalendar);
        const month = monthNames[index];
        const dates = globalCalendar[month];

        const nav = document.createElement('div');
        nav.className = 'month-selector';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'month-nav prev';
        prevBtn.innerHTML = '&lt;';
        prevBtn.onclick = () => {
            currentMonthIndex = (currentMonthIndex - 1 + monthNames.length) % monthNames.length;
            showMonth(currentMonthIndex);
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'month-nav next';
        nextBtn.innerHTML = '&gt;';
        nextBtn.onclick = () => {
            currentMonthIndex = (currentMonthIndex + 1) % monthNames.length;
            showMonth(currentMonthIndex);
        };

        const label = document.createElement('span');
        label.className = 'current-month';
        label.textContent = month;

        nav.appendChild(prevBtn);
        nav.appendChild(label);
        nav.appendChild(nextBtn);

        const daysRow = document.createElement('div');
        daysRow.className = 'dates-container';

        dates.forEach(date => {
            const dayBtn = document.createElement('button');
            dayBtn.className = 'date-btn';
            dayBtn.textContent = date;

            dayBtn.addEventListener('click', () => {
                document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('active'));
                dayBtn.classList.add('active');
                renderBookingsForDate(date);
                console.log('Selected date:', date);
            });

            daysRow.appendChild(dayBtn);
        });

        container.appendChild(nav);
        container.appendChild(daysRow);
    }

    // Booking form submission
    if (bookingForm) {
        bookingForm.onsubmit = function (e) {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const selectedVenueId = document.querySelector('.booking-content h2')?.dataset.venueId;

            formData.append('facility_id', selectedVenueId);

            fetch('add_booking.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    const messageBox = document.getElementById('bookingMessage');

                    if (messageBox) {
                        messageBox.className = data.success ? 'form-message success' : 'form-message error';
                        messageBox.textContent = data.message;
                    }

                    if (data.success) {
                        // Reset form and hide modal after success
                        setTimeout(() => {
                            bookingForm.reset();
                            messageBox.textContent = '';
                            messageBox.className = '';
                            document.getElementById('addBookingModal').style.display = 'none';

                            // Refresh bookings table
                            fetch(`get_bookings.php?facilities_id=${selectedVenueId}`)
                                .then(res => res.json())
                                .then(data => {
                                    allBookings = data.bookings || [];
                                    renderBookingsForDate('___EMPTY___'); // Keep table empty after booking
                                    
                                    // Update calendar if available
                                    if (data.calendar) {
                                        globalCalendar = data.calendar;
                                        renderCalendar(data.calendar);
                                    }
                                });
                        }, 1500);
                    }
                });
        };
    }

    // Search functionality - improved to use startsWith
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim().toLowerCase();
            const venueCards = document.querySelectorAll('.venue-card');
            venueCards.forEach(card => {
                const name = card.querySelector('.venue-name')?.textContent.toLowerCase() || '';
                // Filter: only if name starts with search query
                card.style.display = name.startsWith(query) ? 'flex' : 'none';
            });
        });
    }

    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            const cards = Array.from(document.querySelectorAll('.venue-card'));
            cards.sort((a, b) => {
                const nameA = a.querySelector('.venue-name').textContent.toLowerCase();
                const nameB = b.querySelector('.venue-name').textContent.toLowerCase();
                return sortSelect.value === 'name' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            });
            venuesContainer.innerHTML = '';
            cards.forEach(card => venuesContainer.appendChild(card));
        });
    }

    // Sport filter functionality
    if (sportSelect) {
        sportSelect.addEventListener('change', function () {
            const selectedSport = sportSelect.value.toLowerCase();
            const venueCards = document.querySelectorAll('.venue-card');
            venueCards.forEach(card => {
                const sport = card.querySelector('.venue-sport')?.textContent.toLowerCase() || '';
                card.style.display = selectedSport === '' || sport === selectedSport ? 'flex' : 'none';
            });
        });
    }

    // Back button functionality
    const backBtn = document.querySelector('.btn-back-to-venues');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            if (bookingDetailView) bookingDetailView.classList.add('hidden');
            if (venueCardsView) venueCardsView.style.display = 'flex';
        });
    }

    // Load sports for filter dropdown
    fetch("get_sports.php")
        .then(res => res.json())
        .then(sports => {
            if (sportSelect) {
                sports.forEach(sport => {
                    const option = document.createElement("option");
                    option.value = sport;
                    option.textContent = sport;
                    sportSelect.appendChild(option);
                });
            }
        })
        .catch(err => console.error("Failed to load sports:", err));

    // Modal functionality for adding bookings
    const addBookingBtn = document.querySelector('.btn-add-booking');
    const addBookingModal = document.getElementById('addBookingModal');
    const cancelBtn = document.querySelector('.btn-cancel');

    if (addBookingBtn) {
        addBookingBtn.onclick = function () {
            if (addBookingModal) addBookingModal.style.display = 'flex';
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            if (addBookingModal) addBookingModal.style.display = 'none';
        };
    }

    // Close modal when clicking outside
    window.onclick = function (e) {
        if (e.target === addBookingModal) {
            addBookingModal.style.display = 'none';
        }
    };

    // Message form submission with validation
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const receiver = document.getElementById('receiverInput').value;
            const message = document.getElementById('messageInput').value;

            // Validate message is not empty
            if (!message.trim()) {
                alert("Please enter a message.");
                return;
            }

            fetch('send_message.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ receiver_username: receiver, message })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    document.getElementById('messageModal').style.display = 'none';
                }
            })
            .catch(err => {
                console.error('Error sending message:', err);
                alert('Failed to send message. Please try again.');
            });
        });
    }
});