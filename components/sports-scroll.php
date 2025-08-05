<?php
/**
 * Sports Scroll Component
 * 
 * This component creates a horizontal scrollable list of sports with checkboxes
 * for filtering venues. It dynamically fetches sports from the database and
 * creates interactive filter controls.
 * 
 * Features:
 * - Dynamic sports loading from database
 * - Checkbox-based filtering
 * - Horizontal scrollable layout
 * - Real-time venue filtering
 * 
 * @author BOOK-PLAY Development Team
 * @version 1.0
 * @since 2025
 */
?>

<!-- Sports filter container -->
<section class="sports-scroll" id="sportsContainer"></section>

<script>
/**
 * Initialize sports filter component
 * Fetches available sports and creates interactive filter controls
 */
document.addEventListener("DOMContentLoaded", () => {
  // Fetch sports data from server
  fetch("../BookVenue/fetch_sports.php")
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const container = document.getElementById("sportsContainer");
        container.innerHTML = ""; // Clear existing content

        // Create filter controls for each sport
        data.sports.forEach(sport => {
          // Create label container for each sport item
          const label = document.createElement("label");
          label.className = "sport-item";

          // Create checkbox input for sport selection
          const input = document.createElement("input");
          input.type = "checkbox";
          input.className = "sport-checkbox";

          // Create visual circle element for sport name
          const circle = document.createElement("div");
          circle.className = "sport-circle";
          circle.textContent = sport;
          circle.dataset.sport = sport; // Store sport name as data attribute

          // Add change event listener for real-time filtering
          input.addEventListener("change", () => {
            // Get all checked sports
            const checked = document.querySelectorAll(".sport-checkbox:checked");
            const selectedSports = Array.from(checked).map(cb => cb.nextElementSibling.dataset.sport);
            
            // Apply filter to venues
            filterVenuesBySports(selectedSports);
          });

          // Assemble sport filter item
          label.appendChild(input);
          label.appendChild(circle);
          container.appendChild(label);
        });
      }
    })
    .catch(err => console.error("Failed to fetch sports", err));
});
</script>