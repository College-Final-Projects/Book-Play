function toggleFavorite(element) {
  element.classList.toggle("active");
}
// Validate access code
function validateAccessCode() {
  const enteredCode = document.getElementById('accessCodeInput').value.trim();
  
  if (!enteredCode) {
    alert('Please enter an access code');
    return;
  }
  
  if (enteredCode === currentGroupData.correctCode) {
    // Correct code - join the group
    closeModal();
    redirectToBooking(currentGroupData.name);
  } else {
    // Wrong code
    alert('Incorrect access code. Please try again.');
    document.getElementById('accessCodeInput').value = '';
    document.getElementById('accessCodeInput').focus();
  }
}