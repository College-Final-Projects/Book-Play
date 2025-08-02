// Sample favorite venues data
const favoriteVenues = [
    {
        id: 1,
        name: "Elite Sports Complex",
        sport: "Basketball",
        location: "Downtown Plaza",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop",
        isFavorite: true
    },
    {
        id: 2,
        name: "Ocean View Tennis Club",
        sport: "Tennis",
        location: "Marina District",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=200&fit=crop",
        isFavorite: true
    },
    {
        id: 3,
        name: "City Football Arena",
        sport: "Football",
        location: "Sports Center",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop",
        isFavorite: true
    },
    {
        id: 4,
        name: "Aqua Fitness Center",
        sport: "Swimming",
        location: "Health District",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=200&fit=crop",
        isFavorite: true
    }
];

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
                <div class="rating">
                    <span class="stars">${generateStars(venue.rating)}</span>
                    <span class="rating-text">${venue.rating}/5.0</span>
                </div>
             <button class="view-details-btn" onclick="window.location.href='../VenueDetails/VenueDetails.php'">
  View Details
</button>

            </div>
        </div>
    `;
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
function toggleFavorite(venueId) {
    const venueIndex = favoriteVenues.findIndex(v => v.id === venueId);
    
    if (venueIndex !== -1) {
        // Remove from favorites with smooth animation
        const card = document.querySelector(`[onclick="toggleFavorite(${venueId})"]`).closest('.venue-card');
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            favoriteVenues.splice(venueIndex, 1);
            loadFavorites();
        }, 300);
    }
}

// View venue details
function viewDetails(venueId) {
    const venue = favoriteVenues.find(v => v.id === venueId);
    if (venue) {
        alert(`Viewing details for: ${venue.name}\n\nThis would normally navigate to the venue details page.`);
        // In a real app, you would navigate to: window.location.href = `venue-details.html?id=${venueId}`;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
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