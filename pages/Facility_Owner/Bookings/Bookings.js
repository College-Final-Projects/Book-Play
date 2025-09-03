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

    // Initialize Flatpickr time pickers with improved configuration
    function initializeTimePickers() {
        // Start time picker
        const startTimePicker = flatpickr("#startTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minuteIncrement: 30,
            defaultHour: 9,
            defaultMinute: 0,
            minTime: "06:00",
            maxTime: "23:30",
            onChange: function(selectedDates, dateStr) {
                // Update end time minimum when start time changes
                if (endTimePicker && dateStr) {
                    const startTime = dateStr.split(':');
                    const startHour = parseInt(startTime[0]);
                    const startMinute = parseInt(startTime[1]);
                    
                    // Set minimum end time to 30 minutes after start time
                    let minEndHour = startHour;
                    let minEndMinute = startMinute + 30;
                    
                    if (minEndMinute >= 60) {
                        minEndHour += 1;
                        minEndMinute = 0;
                    }
                    
                    const minEndTime = `${minEndHour.toString().padStart(2, '0')}:${minEndMinute.toString().padStart(2, '0')}`;
                    endTimePicker.set('minTime', minEndTime);
                    
                    // Clear end time if it's now invalid
                    const currentEndTime = document.getElementById('endTime').value;
                    if (currentEndTime && currentEndTime <= dateStr) {
                        endTimePicker.clear();
                    }
                }
            }
        });

        // End time picker
        const endTimePicker = flatpickr("#endTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minuteIncrement: 30,
            defaultHour: 10,
            defaultMinute: 0,
            minTime: "06:30",
            maxTime: "23:59"
        });

        return { startTimePicker, endTimePicker };
    }

    // Initialize date picker
    function initializeDatePicker() {
        return flatpickr("#dateInput", {
            dateFormat: "Y-m-d",
            minDate: new Date().fp_incr(1), // Tomorrow onwards
            disableMobile: true,
            locale: {
                firstDayOfWeek: 1 // Start week on Monday
            }
        });
    }

    // Initialize time and date pickers
    const timePickers = initializeTimePickers();
    const datePicker = initializeDatePicker();

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

                    // Handle image path - check if it's already a full path or just filename
                    let imagePath;
                    if (venue.image && venue.image !== 'null' && venue.image.trim() !== '') {
                        if (venue.image.startsWith('http') || venue.image.startsWith('/')) {
                            // Full URL or absolute path
                            imagePath = venue.image;
                        } else {
                            // Just filename, construct full path
                            imagePath = `../../../uploads/venues/${venue.image}`;
                        }
                    } else {
                        // No image or null, use default
                        imagePath = '../../../uploads/venues/default.jpg';
                                        }
                    
                    card.innerHTML = `
                        <div class="venue-header">
                            <div class="venue-rating">${starsHTML} (${venue.rating ?? 'N/A'})</div>
                        </div>
                        <img src="${imagePath}" class="venue-image" alt="${venue.name}" onerror="this.src='../../../uploads/venues/default.jpg'" />
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
                                renderBookingsForDate('___EMPTY___');
                                
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

    // Enhanced form validation function
    function validateBookingForm() {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const dateInput = document.getElementById('dateInput').value;
        const playersInput = document.getElementById('playersInput')?.value;

        // Clear previous error messages
        clearErrorMessages();

        let isValid = true;
        const errors = [];

        // Validate date
        if (!dateInput) {
            errors.push("Please select a booking date.");
            isValid = false;
        }

        // Validate start time
        if (!startTime) {
            errors.push("Please select a start time.");
            isValid = false;
        }

        // Validate end time
        if (!endTime) {
            errors.push("Please select an end time.");
            isValid = false;
        }

        // Validate time logic
        if (startTime && endTime) {
            if (startTime >= endTime) {
                errors.push("End time must be after start time.");
                isValid = false;
            }

            // Check minimum duration (30 minutes)
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);
            const diffMinutes = (end - start) / (1000 * 60);

            if (diffMinutes < 30) {
                errors.push("Minimum booking duration is 30 minutes.");
                isValid = false;
            }
        }

        // Validate players (if field exists)
        if (playersInput !== undefined) {
            const players = parseInt(playersInput);
            if (!players || players < 1) {
                errors.push("Please enter a valid number of players.");
                isValid = false;
            }
        }

        // Display errors
        if (!isValid) {
            showErrors(errors);
        }

        return isValid;
    }

    function showErrors(errors) {
        const messageBox = document.getElementById('bookingMessage');
        if (messageBox) {
            messageBox.className = 'form-message error';
            messageBox.innerHTML = errors.join('<br>');
        }
    }

    function clearErrorMessages() {
        const messageBox = document.getElementById('bookingMessage');
        if (messageBox) {
            messageBox.textContent = '';
            messageBox.className = '';
        }
    }

    // Booking form submission with enhanced validation
    if (bookingForm) {
        bookingForm.onsubmit = function (e) {
            e.preventDefault();

            // Validate form before submission
            if (!validateBookingForm()) {
                return;
            }

            const formData = new FormData(bookingForm);
            const selectedVenueId = document.querySelector('.booking-content h2')?.dataset.venueId;

            if (!selectedVenueId) {
                showErrors(["Unable to identify selected venue. Please try again."]);
                return;
            }

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
                        setTimeout(() => {
                            bookingForm.reset();
                            // Reset time pickers
                            timePickers.startTimePicker.clear();
                            timePickers.endTimePicker.clear();
                            datePicker.clear();
                            
                            clearErrorMessages();
                            document.getElementById('addBookingModal').style.display = 'none';

                            // Refresh bookings
                            fetch(`get_bookings.php?facilities_id=${selectedVenueId}`)
                                .then(res => res.json())
                                .then(data => {
                                    allBookings = data.bookings || [];
                                    renderBookingsForDate('___EMPTY___');
                                    
                                    if (data.calendar) {
                                        globalCalendar = data.calendar;
                                        renderCalendar(data.calendar);
                                    }
                                });
                        }, 1500);
                    }
                })
                .catch(error => {
                    console.error('Booking submission error:', error);
                    showErrors(["Failed to submit booking. Please try again."]);
                });
        };
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim().toLowerCase();
            const venueCards = document.querySelectorAll('.venue-card');
            venueCards.forEach(card => {
                const name = card.querySelector('.venue-name')?.textContent.toLowerCase() || '';
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

    // Modal functionality
    const addBookingBtn = document.querySelector('.btn-add-booking');
    const addBookingModal = document.getElementById('addBookingModal');
    const cancelBtn = document.querySelector('.btn-cancel');

    if (addBookingBtn) {
        addBookingBtn.onclick = function () {
            if (addBookingModal) {
                addBookingModal.style.display = 'flex';
                clearErrorMessages(); // Clear any previous error messages
            }
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            if (addBookingModal) {
                addBookingModal.style.display = 'none';
                clearErrorMessages();
            }
        };
    }

    // Close modal when clicking outside
    window.onclick = function (e) {
        if (e.target === addBookingModal) {
            addBookingModal.style.display = 'none';
            clearErrorMessages();
        }
    };

    // Message form submission
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const receiver = document.getElementById('receiverInput').value;
            const message = document.getElementById('messageInput').value;

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