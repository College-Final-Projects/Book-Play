const stars = document.querySelectorAll('#rating i');
let currentRating = 0;

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
    currentRating = star.dataset.value;
    highlightStars(currentRating);
  });
});

function highlightStars(rating) {
  stars.forEach(star => {
    if (star.dataset.value <= rating) {
      star.classList.add('filled');
    }
  });
}

function resetStars() {
  stars.forEach(star => {
    star.classList.remove('filled');
  });
}
document.addEventListener('DOMContentLoaded', () => {
    const comments = document.querySelectorAll('.comment-card');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const viewLessBtn = document.getElementById('view-less-btn');
    const initialVisible = 3;

    // Hide comments beyond initialVisible
    comments.forEach((comment, index) => {
      if (index >= initialVisible) {
        comment.style.display = 'none';
      }
    });

    viewMoreBtn.addEventListener('click', () => {
      comments.forEach(comment => comment.style.display = 'block');
      viewMoreBtn.style.display = 'none';
      viewLessBtn.style.display = 'block';
    });

    viewLessBtn.addEventListener('click', () => {
      comments.forEach((comment, index) => {
        comment.style.display = index < initialVisible ? 'block' : 'none';
      });
      viewMoreBtn.style.display = 'block';
      viewLessBtn.style.display = 'none';
    });
  });

  