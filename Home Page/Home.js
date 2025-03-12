 // JavaScript to filter facilities based on selected location
 document.getElementById('location-select').addEventListener('change', function() {
    const selectedLocation = this.value;
    const facilities = document.querySelectorAll('.facility');

    facilities.forEach(facility => {
        if (selectedLocation === 'all' || facility.dataset.location === selectedLocation) {
            facility.style.display = 'block';
        } else {
            facility.style.display = 'none';
        }
    });
});