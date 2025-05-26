document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const sportSelect = document.getElementById('sortSelectSport');
    const venuesContainer = document.querySelector('.venues-container');
    const bookingDetailView = document.getElementById('booking-detail-view');
    const venueCardsView = document.getElementById('venue-cards-view');
    const bookingForm = document.getElementById('bookingForm');
    const venueList = document.querySelector('.venues-list');

    fetch("BookedFacilitiesFetch.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                venuesContainer.innerHTML = "";
                if (venueList) venueList.innerHTML = '';

                data.venues.forEach((venue, index) => {
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
                    if (index === 0) li.classList.add('active');
                    venueList?.appendChild(li);

                    const viewBtn = card.querySelector('.btn-view-bookings');
                    const openVenueView = () => {
                        venueCardsView.style.display = 'none';
                        bookingDetailView.classList.remove('hidden');

                        document.querySelectorAll('.venues-list li').forEach(li => li.classList.remove('active'));
                        li.classList.add('active');

                        const venueTitle = document.querySelector('.booking-content .venue-details h2');
                        const venueLocation = document.querySelector('.location-badge');
                        const venueRating = document.querySelector('.rating-badge');

                        if (venueTitle) {
                            venueTitle.textContent = venue.name;
                            venueTitle.dataset.venueId = venue.id;
                        }
                        if (venueLocation) venueLocation.textContent = venue.location;
                        if (venueRating) venueRating.textContent = `${starsHTML} (${venue.rating ?? 'N/A'})`;

                        fetch(`get_bookings.php?facilities_id=${venue.id}`)
                            .then(res => res.json())
                            .then(data => {
                                const tbody = document.querySelector('.bookings-table tbody');
                                tbody.innerHTML = '';
                                if (data.success && data.bookings.length > 0) {
                                    data.bookings.forEach(b => {
                                        const row = document.createElement('tr');
                                        row.innerHTML = `
                                            <td class="user-column"><span>${b.username}</span></td>
                                            <td>${b.players}</td>
                                            <td>${b.time}</td>
                                            <td><button class="btn-send-message">Send Message</button></td>
                                        `;
                                        tbody.appendChild(row);
                                    });
                                } else {
                                    tbody.innerHTML = '<tr><td colspan="4">No bookings found.</td></tr>';
                                }
                            });
                    };

                    viewBtn.addEventListener('click', openVenueView);
                    li.addEventListener('click', openVenueView);
                });
            }
        });

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
                        setTimeout(() => {
                            bookingForm.reset();
                            messageBox.textContent = '';
                            messageBox.className = '';
                            document.getElementById('addBookingModal').style.display = 'none';

                            fetch(`get_bookings.php?facilities_id=${selectedVenueId}`)
                                .then(res => res.json())
                                .then(data => {
                                    const tbody = document.querySelector('.bookings-table tbody');
                                    tbody.innerHTML = '';
                                    if (data.success && data.bookings.length > 0) {
                                        data.bookings.forEach(b => {
                                            const row = document.createElement('tr');
                                            row.innerHTML = `
                                                <td class="user-column"><span>${b.username}</span></td>
                                                <td>${b.players}</td>
                                                <td>${b.time}</td>
                                                <td><button class="btn-send-message">Send Message</button></td>
                                            `;
                                            tbody.appendChild(row);
                                        });
                                    }
                                });
                        }, 1500);
                    }
                });
        };
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim().toLowerCase();
            const venueCards = document.querySelectorAll('.venue-card');
            venueCards.forEach(card => {
                const name = card.querySelector('.venue-name')?.textContent.toLowerCase() || '';
                card.style.display = name.includes(query) ? 'flex' : 'none';
            });
        });
    }

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

    const backBtn = document.querySelector('.btn-back-to-venues');
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            if (bookingDetailView) bookingDetailView.classList.add('hidden');
            if (venueCardsView) venueCardsView.style.display = 'flex';
        });
    }

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
});
