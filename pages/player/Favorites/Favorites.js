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
    const availabilityStatus = venue.is_available ? 'Available' : 'Not Available';
    const availabilityClass = venue.is_available ? 'available' : 'unavailable';
    
    return `
        <div class="venue-card" data-venue-id="${venue.id}">
            <img src="${venue.image}" alt="${venue.name}" class="venue-image" onerror="this.src='../../../Images/default.jpg'" onload="console.log('✅ Image loaded successfully:', this.src)">
            <div class="favorite-icon" onclick="toggleFavorite(${venue.id})">
                ❤️
            </div>
            <div class="availability-badge ${availabilityClass}">${availabilityStatus}</div>
            <div class="card-content">
                <h3 class="venue-name">${venue.name}</h3>
                <span class="sport-type">${venue.sport}</span>
                <div class="location">📍 ${venue.location}</div>
                <div class="price">💰 $${venue.price}/hour</div>
                <div class="rating">
                    <span class="stars">${generateStars(venue.rating)}</span>
                    <span class="rating-text">${venue.rating}/5.0 (${venue.rating_count} reviews)</span>
                </div>
                <button class="view-details-btn" onclick="viewDetails(${venue.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

// Fetch favorite venues from API
async function fetchFavorites() {
    try {
        const response = await fetch('FavoritesAPI.php?action=list');
        const data = await response.json();
        
        if (data.success) {
            favoriteVenues = data.favorites;
            loadFavorites();
        } else {
            console.error('Error fetching favorites:', data.message);
            showNotification('Error loading favorites', 'error');
        }
    } catch (error) {
        console.error('Error fetching favorites:', error);
        showNotification('Error loading favorites', 'error');
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

// Toggle favorite status (remove from favorites)
async function toggleFavorite(venueId) {
    try {
        const formData = new FormData();
        formData.append('facility_id', venueId);
        
        const response = await fetch('FavoritesAPI.php?action=remove', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from favorites with smooth animation
            const card = document.querySelector(`[data-venue-id="${venueId}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    // Remove from local array
                    favoriteVenues = favoriteVenues.filter(v => v.id !== venueId);
                    loadFavorites();
                    showNotification('Removed from favorites', 'success');
                }, 300);
            }
        } else {
            showNotification(data.message || 'Error removing from favorites', 'error');
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        showNotification('Error removing from favorites', 'error');
    }
}

// View venue details
function viewDetails(venueId) {
    // Navigate to venue details page
    window.location.href = `../VenueDetails/VenueDetails.php?facilities_id=${venueId}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);