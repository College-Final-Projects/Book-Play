// Make currentRating global
let currentRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facility_id');

  if (!facilityId) {
    alert("Facility ID not found in URL.");
    return;
  }

  fetch(`VenueAPI.php?facility_id=${facilityId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert("Error loading facility: " + data.message);
        return;
      }
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

      // Populate venue info
      document.getElementById('venue-image').src = facility.image_url;
      document.getElementById('venue-name').textContent = facility.place_name;
      document.getElementById('venue-location').textContent = `📍 Location: ${facility.location}`;
      document.getElementById('venue-sport').textContent = `⚽ Sport: ${facility.SportCategory}`;
      document.getElementById('venue-owner').textContent = `👤 Owner: ${facility.owner_username}`;
      document.getElementById('venue-price').textContent = `₪${facility.price} / hour`;
      document.getElementById('venue-description').textContent = facility.description;

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
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facility_id');
  
  if (!reason) {
    alert("Please select a reason.");
    return;
  }

  fetch('SubmitReport.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      facility_id: facilityId, 
      reason: reason, 
      details: details 
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Thank you for your report!");
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
      alert("An error occurred while submitting your report.");
    });
}

// Submit review
document.querySelector('.submit-btn').addEventListener('click', () => {
  const params = new URLSearchParams(window.location.search);
  const facilityId = params.get('facility_id');
  const rating = parseInt(currentRating);
  const comment = document.querySelector('.add-comment textarea').value.trim();

  if (!rating || comment === "") {
    alert("Please provide both rating and comment.");
    return;
  }

  fetch('SubmitRating.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ facility_id: facilityId, rating, comment })
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
