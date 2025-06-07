document.addEventListener('DOMContentLoaded', () => {

  /*** STAR RATING LOGIC ***/
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

  /*** COMMENTS TOGGLE LOGIC ***/
  const comments = document.querySelectorAll('.comment-card');
  const viewMoreBtn = document.getElementById('view-more-btn');
  const viewLessBtn = document.getElementById('view-less-btn');
  const initialVisible = 3;

  // Initial state: show only first 3 comments
  comments.forEach((comment, index) => {
    comment.style.display = index < initialVisible ? 'block' : 'none';
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

/*** GLOBAL MODAL HANDLING ***/
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

  console.log("Submitted Report: ", { reason, details });
  alert("Thank you for your report!");
  closeReportModal();
}
/*** CHARACTER COUNTER FOR REPORT TEXTAREA ***/
const detailsInput = document.getElementById("details");
const charCounter = document.getElementById("charCounter");

detailsInput.addEventListener('input', () => {
  charCounter.textContent = `${detailsInput.value.length} / 100`;
});
