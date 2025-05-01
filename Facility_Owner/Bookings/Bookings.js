document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (navLinks.classList.contains('active') && 
          !event.target.closest('.nav-links') && 
          !event.target.closest('.mobile-menu-btn')) {
        navLinks.classList.remove('active');
      }
    });

    // Modal functions - example
    const viewButtons = document.querySelectorAll('.booking-table button');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModal = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    // Open modal
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
      });
    });
    
    // Close modal
    [closeModal, cancelBtn].forEach(element => {
      element.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
      });
    });
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
      }
    });
  });