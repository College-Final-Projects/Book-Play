// Make currentRating global
let currentRating = 0;

// Smart back button function - goes to previous page or fallback
window.goBack = function goBack() {
  console.log('🔙 Back button clicked');
  
  fetch('VenueDetails.php?action=get_previous_page')
    .then(res => {
      console.log('📡 Response received:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('📊 Previous page data:', data);
      if (data.debug) {
        console.log('🔍 Debug info:', data.debug);
      }
      
      if (data.url && data.url !== window.location.href) {
        // Check if it's a valid previous page
        const url = data.url.toLowerCase();
        
        // Prefer these pages as valid previous pages
        const validPages = ['bookvenue', 'managevenue', 'favorites', 'homepage'];
        const isValidPage = validPages.some(page => url.includes(page.toLowerCase()));
        
        if (isValidPage) {
          console.log('✅ Going to stored previous page:', data.url);
          window.location.href = data.url;
        } else {
          console.log('⚠️ Previous page not in valid list, using BookVenue fallback');
          window.location.href = '../BookVenue/BookVenue.php';
        }
      } else {
        console.log('⚠️ No valid previous page, using fallback');
        // Fallback to browser history or default page
        if (window.history.length > 1) {
          console.log('📜 Using browser history back');
          window.history.back();
        } else {
          console.log('🏠 Going to BookVenue page (ultimate fallback)');
          window.location.href = '../BookVenue/BookVenue.php';
        }
      }
    })
    .catch(error => {
      console.error('❌ Error getting previous page:', error);
      // Fallback on error
      if (window.history.length > 1) {
        console.log('📜 Error fallback: using browser history back');
        window.history.back();
      } else {
        console.log('🏠 Error fallback: going to BookVenue page');
        window.location.href = '../BookVenue/BookVenue.php';
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 VenueDetails.js DOMContentLoaded triggered');
  
  // Add event listener to back button as backup
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      console.log('🔙 Back button clicked via event listener');
      e.preventDefault();
      goBack();
    });
    console.log('✅ Back button event listener added');
  }
  
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facilities_id');

  console.log('🔍 VenueDetails loading for facility_id:', facilityId);
  console.log('📍 Current URL:', window.location.href);
  console.log('🔗 All URL params:', Object.fromEntries(params));

  if (!facilityId) {
    console.error('❌ No facility_id found in URL');
    alert("Facility ID not found in URL.");
    return;
  }

  console.log('📡 Making API request to VenueAPI.php...');
  fetch(`VenueAPI.php?facilities_id=${facilityId}`)
    .then(res => {
      console.log('📡 API Response status:', res.status);
      console.log('📡 API Response headers:', res.headers);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('📊 API Response data:', data);
      
      if (!data.success) {
        console.error('❌ API returned error:', data.message);
        alert("Error loading facility: " + data.message);
        return;
      }

      console.log('✅ API call successful, populating data...');

      // Show average rating in stars
      const starsContainer = document.getElementById('venue-stars');
      const average = parseFloat(data.average_rating || 0);

      const fullStars = Math.floor(average);
      const halfStar = average - fullStars >= 0.5;
      let starsHTML = '';

      for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
          starsHTML += '★'; // full star
        } else {
          starsHTML += '☆'; // empty star
        }
      }
      starsContainer.textContent = starsHTML;

      const facility = data.facility;
      console.log('🏟️ Facility data:', facility);

      // Populate venue info
      const imageElement = document.getElementById('venue-image');
      
      // Handle image path - check if it's already a full path or just filename
      let imagePath;
      if (facility.image_url && facility.image_url !== 'null' && facility.image_url.trim() !== '') {
        if (facility.image_url.startsWith('http') || facility.image_url.startsWith('/')) {
          // Full URL or absolute path
          imagePath = facility.image_url;
        } else {
          // Just filename, construct full path
          imagePath = `../../../uploads/venues/${facility.image_url}`;
        }
      } else {
        // No image or null, use default
        imagePath = '../../../Images/default.jpg';
      }
      
      console.log('🖼️ Setting image path:', imagePath);
      imageElement.src = imagePath;
      
      // Add error handling for image
      imageElement.onerror = function() {
        console.log('❌ Image failed to load, using default');
        this.src = '../../../Images/default.jpg';
      };
      
      document.getElementById('venue-name').textContent = facility.place_name;
      document.getElementById('venue-location').textContent = `📍 Location: ${facility.location}`;
      document.getElementById('venue-sport').textContent = `⚽ Sport: ${facility.SportCategory}`;
      document.getElementById('venue-owner').textContent = `👤 Owner: ${facility.owner_username || 'Not specified'}`;
      document.getElementById('venue-price').textContent = `₪${facility.price} / hour`;
      document.getElementById('venue-description').textContent = facility.description || 'No description available.';

      // Populate comments
      const commentsContainer = document.getElementById('commentsContainer');
      const viewMoreBtn = document.getElementById('view-more-btn');
      const viewLessBtn = document.getElementById('view-less-btn');
      commentsContainer.innerHTML = '';

      const allComments = [];

      data.comments.forEach((comment, index) => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        card.style.backgroundColor = '#e0f7ff';

        const user = document.createElement('div');
        user.className = 'user';
        user.textContent = comment.username;

        const stars = document.createElement('div');
        stars.className = 'comment-stars';
        stars.textContent = '★'.repeat(comment.rating_value) + '☆'.repeat(5 - comment.rating_value);

        const text = document.createElement('div');
        text.className = 'text';
        text.textContent = comment.comment;

        card.appendChild(user);
        card.appendChild(stars);
        card.appendChild(text);
        card.style.display = index < 3 ? 'block' : 'none';

        commentsContainer.appendChild(card);
        allComments.push(card);
      });

      if (allComments.length > 3) {
        viewMoreBtn.style.display = 'block';
        viewLessBtn.style.display = 'none';

        viewMoreBtn.onclick = () => {
          allComments.forEach(card => card.style.display = 'block');
          viewMoreBtn.style.display = 'none';
          viewLessBtn.style.display = 'block';
        };

        viewLessBtn.onclick = () => {
          allComments.forEach((card, index) => {
            card.style.display = index < 3 ? 'block' : 'none';
          });
          viewMoreBtn.style.display = 'block';
          viewLessBtn.style.display = 'none';
        };
      } else {
        viewMoreBtn.style.display = 'none';
        viewLessBtn.style.display = 'none';
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      alert("Failed to fetch facility data.");
    });

  // Star Rating UI
  const stars = document.querySelectorAll('#rating i');
  stars.forEach(star => {
    star.addEventListener('mouseover', () => {
      resetStars();
      highlightStars(star.dataset.value);
    });
    star.addEventListener('mouseout', () => {
      resetStars();
      highlightStars(currentRating);
    });
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.value); // Store globally
      highlightStars(currentRating);
    });
  });

  function highlightStars(rating) {
    stars.forEach(star => {
      if (parseInt(star.dataset.value) <= rating) {
        star.classList.add('filled');
      }
    });
  }

  function resetStars() {
    stars.forEach(star => {
      star.classList.remove('filled');
    });
  }

  // Character counter
  const detailsInput = document.getElementById("details");
  const charCounter = document.getElementById("charCounter");
  detailsInput?.addEventListener('input', () => {
    charCounter.textContent = `${detailsInput.value.length} / 100`;
  });
});

// Report modal handling
function openReportModal() {
  document.getElementById("reportModal").style.display = "flex";
}
function closeReportModal() {
  document.getElementById("reportModal").style.display = "none";
}
function submitReport() {
  const reason = document.getElementById("reason").value;
  const details = document.getElementById("details").value;
  
  if (!reason) {
    alert("Please select a reason.");
    return;
  }

  // Get facility ID from URL
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facilities_id');
  
  if (!facilityId) {
    alert("Venue ID not found. Please try again.");
    return;
  }

  // Send report to backend
  fetch('SubmitReport.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      facilities_id: facilityId, 
      reason: reason, 
      details: details 
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Thank you for your report! It has been submitted successfully.");
      closeReportModal();
      // Clear the form
      document.getElementById("reason").value = "";
      document.getElementById("details").value = "";
      document.getElementById("charCounter").textContent = "0 / 100";
    } else {
      alert("Failed to submit report: " + data.message);
    }
  })
  .catch(err => {
    console.error("Report submission error:", err);
    alert("An error occurred while submitting your report. Please try again.");
  });
}

// Submit review
document.querySelector('.submit-btn').addEventListener('click', () => {
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facilities_id');
  const rating = parseInt(currentRating);
  const comment = document.querySelector('.add-comment textarea').value.trim();

  if (!rating || comment === "") {
    alert("Please provide both rating and comment.");
    return;
  }

  fetch('SubmitRating.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ facilities_id: facilityId, rating, comment })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Thank you for your feedback!");
        location.reload(); // Optional: reload to see new comment
      } else {
        alert("Failed to submit: " + data.message);
      }
    })
    .catch(err => {
      console.error("Submit error:", err);
      alert("An error occurred while submitting your rating.");
    });
});
