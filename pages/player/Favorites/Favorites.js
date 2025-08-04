// Global variable to store favorite venues
let favoriteVenues = [];

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '★';
    }
    
    if (hasHalfStar) {
        starsHtml += '☆';
    }
    
    return starsHtml;
}

// Create venue card HTML
function createVenueCard(venue) {
    return `
        <div class="venue-card">
            <img src="${venue.image}" alt="${venue.name}" class="venue-image">
            <div class="favorite-icon" onclick="toggleFavorite(${venue.id})">
                ❤️
            </div>
            <div class="card-content">
                <h3 class="venue-name">${venue.name}</h3>
                <span class="sport-type">${venue.sport}</span>
                <div class="location">📍 ${venue.location}</div>
                <div class="price">💰 $${venue.price}</div>
                <div class="availability ${venue.is_available ? 'available' : 'unavailable'}">
                    ${venue.is_available ? '✅ Available' : '❌ Unavailable'}
                </div>
<<<<<<< HEAD
                <button class="view-details-btn" onclick="viewDetails(${venue.id})">
                    View Details
                </button>
=======
             <button class="view-details-btn" onclick="window.location.href='../VenueDetails/VenueDetails.php?facility_id=${venue.id}'">
  View Details
</button>

>>>>>>> 959a443ed196a3edef798af351ee8d74e088b501
            </div>
        </div>
    `;
}

// Fetch favorites from server
async function fetchFavorites() {
    try {
        const response = await fetch('Favorites.php?action=get_favorites');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch favorites');
        }
        
        favoriteVenues = data;
        loadFavorites();
    } catch (error) {
        console.error('Error fetching favorites:', error);
        showError('Failed to load favorites. Please try again.');
    }
}

// Load and display favorite venues
function loadFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (favoriteVenues.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = favoriteVenues
            .map(venue => createVenueCard(venue))
            .join('');
    }
}

// Toggle favorite status
async function toggleFavorite(venueId) {
    try {
        const response = await fetch('../BookVenue/toggle_favorite.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `facility_id=${venueId}`
        });
        
        if (response.ok) {
            // Remove from local array and update display
            favoriteVenues = favoriteVenues.filter(v => v.id !== venueId);
            
            // Remove card with animation
            const card = document.querySelector(`[onclick="toggleFavorite(${venueId})"]`).closest('.venue-card');
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                loadFavorites();
            }, 300);
        } else {
            throw new Error('Failed to remove from favorites');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to remove from favorites. Please try again.');
    }
}

// View venue details
function viewDetails(venueId) {
    window.location.href = `../VenueDetails/VenueDetails.php?id=${venueId}`;
}

// Show error message
function showError(message) {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
        <div class="empty-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="fetchFavorites()" class="retry-btn">Retry</button>
    `;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    fetchFavorites();
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add entrance animation to cards
    setTimeout(() => {
        const cards = document.querySelectorAll('.venue-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
});