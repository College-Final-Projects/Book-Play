function waitForGoogleMaps(callback) {
  if (typeof google !== "undefined" && google.maps && google.maps.geometry) {
    callback();
  } else {
    setTimeout(() => waitForGoogleMaps(callback), 100);
  }
}

function filterVenuesBySports(sports = [], searchTerm = "") {
  const container = document.getElementById("venuesContainer");
  container.innerHTML = "<p>Loading venues...</p>";

  const params = new URLSearchParams();
  sports.forEach(sport => params.append("sports[]", sport));
  if (searchTerm) params.append("search", searchTerm);

  fetch("fetch_venues.php?" + params.toString())
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        container.innerHTML = "<p>No venues found.</p>";
        return;
      }

      const sortOptions = {
        available: document.querySelector("input[name='Available-sort']:checked")?.id,
        price: document.querySelector("input[name='price-sort']:checked")?.id,
        rating: document.querySelector("input[name='rating-sort']:checked")?.id,
        distance: document.querySelector("input[name='distance-sort']:checked")?.id
      };

      navigator.geolocation.getCurrentPosition(position => {
        const userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        data.venues.forEach(v => {
          const venueLatLng = new google.maps.LatLng(v.latitude, v.longitude);
          v.distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, venueLatLng) / 1000;
        });

        const sortedVenues = sortVenues(data.venues, sortOptions);
        renderVenues(sortedVenues);
      }, () => {
        const sortedVenues = sortVenues(data.venues, sortOptions);
        renderVenues(sortedVenues);
      });
    })
    .catch(err => {
      container.innerHTML = "<p>Error loading venues.</p>";
      console.error(err);
    });
}

function sortVenues(venues, sortOptions) {
  // First filter by availability if needed
  if (sortOptions.available === "Available") {
    venues = venues.filter(v => v.available === 1 || v.available === true);
  }

  // Sort venues based on selected options
  venues.sort((a, b) => {
    // Distance sorting (highest priority)
    if (sortOptions.distance === "distance-near") {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
    } else if (sortOptions.distance === "distance-far") {
      if (a.distance !== undefined && b.distance !== undefined) {
        return b.distance - a.distance;
      }
    }

    // Rating sorting
    if (sortOptions.rating === "rating-high") {
      const ratingA = parseFloat(a.avg_rating) || 0;
      const ratingB = parseFloat(b.avg_rating) || 0;
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }
    } else if (sortOptions.rating === "rating-low") {
      const ratingA = parseFloat(a.avg_rating) || 0;
      const ratingB = parseFloat(b.avg_rating) || 0;
      if (ratingA !== ratingB) {
        return ratingA - ratingB;
      }
    }

    // Price sorting
    if (sortOptions.price === "price-low") {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
    } else if (sortOptions.price === "price-high") {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      if (priceA !== priceB) {
        return priceB - priceA;
      }
    }

    return 0;
  });

  return venues;
}

function toggleFavorite(iconElement, facilityId) {
  fetch('toggle_favorite.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ facility_id: facilityId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      iconElement.classList.toggle('active', data.favorited);
    }
  });
}

function renderVenues(venues) {
  const container = document.getElementById("venuesContainer");
  container.innerHTML = "";

  if (venues.length === 0) {
    container.innerHTML = "<p>No venues available.</p>";
    return;
  }

  venues.forEach(venue => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.onclick = () => {
      window.location.href = `../VenueDetails/VenueDetails.php?facility_id=${venue.facilities_id}`;
    };

    const ratingValue = parseFloat(venue.avg_rating) || 0;
    const fullStars = Math.floor(ratingValue);
    const halfStar = (ratingValue - fullStars) >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    const starsHTML = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '✩'.repeat(emptyStars);

    const isFavorited = venue.is_favorite ? 'active' : '';

    card.innerHTML = `
      <div class="venue-image">
        <img src="../../../uploads/venues/${venue.image_url}" alt="Venue Image">
        <div class="favorite-icon ${isFavorited}" onclick="event.stopPropagation(); toggleFavorite(this, ${venue.facilities_id})">&#10084;</div>
      </div>
      <div class="venue-content">
        <h3 class="venue-title">${venue.place_name}</h3>
        <div class="venue-location">
          📍 
          <a href="https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}" 
             target="_blank" 
             onclick="event.stopPropagation();">
            ${venue.location}
          </a>
        </div>
        <div class="venue-rating">
          ${starsHTML} (${Number(venue.avg_rating ?? 0).toFixed(1)})
        </div>
        <div class="venue-sport">
          🏅 Sport: ${venue.SportCategory || "N/A"}
        </div>
        <div class="venue-footer">
          <div class="price">₪${venue.price}<span class="per">/hour</span></div>
          <div class="distance">${venue.distance?.toFixed(2) || '–'} km away</div>
          <button class="book-btn" onclick="event.stopPropagation(); window.location.href='../CreateBooking/CreateBooking.php?facility_id=${venue.facilities_id}'">Book Now</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  waitForGoogleMaps(() => {
    filterVenuesBySports([]);
  });

  const sortGroups = ["Available-sort", "price-sort", "rating-sort", "distance-sort"];
  sortGroups.forEach(group => {
    document.querySelectorAll(`input[name='${group}']`).forEach(radio => {
      radio.addEventListener("change", () => {
        const searchValue = document.getElementById("playerSearch").value.trim();
        filterVenuesBySports([], searchValue);
      });
    });
  });

  const searchInput = document.getElementById("playerSearch");
  let searchTimeout;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchValue = searchInput.value.trim();
      filterVenuesBySports([], searchValue);
    }, 300);
  });
});
