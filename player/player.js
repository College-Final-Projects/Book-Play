// Sport Icon Mapping System
const sportIconMap = {
  // Ball Sports
  'football': '⚽', 'soccer': '⚽', 'basketball': '🏀', 'tennis': '🎾',
  'volleyball': '🏐', 'baseball': '⚾', 'softball': '🥎', 'cricket': '🏏',
  'rugby': '🏉', 'ping pong': '🏓', 'table tennis': '🏓', 'badminton': '🏸',
  'golf': '⛳', 'bowling': '🎳',
  
  // Water Sports  
  'swimming': '🏊', 'diving': '🤿', 'surfing': '🏄', 'water polo': '🤽',
  'sailing': '⛵', 'kayaking': '🛶', 'rowing': '🚣',
  
  // Combat Sports
  'boxing': '🥊', 'martial arts': '🥋', 'karate': '🥋', 'judo': '🥋',
  'taekwondo': '🥋', 'wrestling': '🤼', 'fencing': '🤺',
  
  // Fitness & Gym
  'fitness': '🏋️', 'weightlifting': '🏋️', 'gym': '🏋️', 'crossfit': '🏋️',
  'bodybuilding': '💪', 'powerlifting': '🏋️',
  
  // Track & Field
  'running': '🏃', 'marathon': '🏃', 'jogging': '🏃', 'sprinting': '🏃',
  'athletics': '🏃', 'hurdles': '🏃',
  
  // Cycling & Motor
  'cycling': '🚴', 'biking': '🚴', 'mountain biking': '🚵', 'bmx': '🚴',
  'motorcycle': '🏍️', 'racing': '🏎️',
  
  // Winter Sports
  'skiing': '⛷️', 'snowboarding': '🏂', 'ice skating': '⛸️',
  'hockey': '🏒', 'ice hockey': '🏒', 'curling': '🥌', 'sledding': '🛷',
  
  // Adventure Sports
  'climbing': '🧗', 'rock climbing': '🧗', 'mountaineering': '🏔️',
  'hiking': '🥾', 'archery': '🏹', 'hunting': '🏹', 'fishing': '🎣',
  
  // Other Sports
  'american football': '🏈', 'handball': '🤾', 'lacrosse': '🥍',
  'field hockey': '🏑', 'dancing': '💃', 'ballet': '🩰',
  'gymnastics': '🤸', 'yoga': '🧘', 'pilates': '🧘',
  'skateboarding': '🛹', 'rollerblading': '🛼', 'horseback riding': '🏇',
  'polo': '🏇', 'equestrian': '🏇', 'cheerleading': '📣'
};

// Function to get icon for a sport
function getSportIcon(sportName) {
  const cleanName = sportName.toLowerCase().trim();
  
  // Direct match
  if (sportIconMap[cleanName]) {
    return sportIconMap[cleanName];
  }
  
  // Partial match - check if sport name contains any keywords
  for (const [key, icon] of Object.entries(sportIconMap)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return icon;
    }
  }
  
  // Default fallback icon
  return '🏃'; // Default running icon for unknown sports
}

// Function to generate sport HTML element
function generateSportElement(sportName, isSelected = false) {
  const icon = getSportIcon(sportName);
  const sportId = `sport-${sportName.toLowerCase().replace(/\s+/g, '')}`;
  const checkedAttr = isSelected ? 'checked' : '';
  
  return `
    <div class="sport-item">
      <input type="radio" name="sport" id="${sportId}" ${checkedAttr}>
      <label for="${sportId}" class="sport-circle">
        <span class="sport-emoji">${icon}</span>
        <span>${sportName}</span>
      </label>
    </div>
  `;
}

// Function to add sports to page
function addSportsToPage(sportsList) {
  const container = document.querySelector('.sports-scroll');
  if (!container) {
    console.error('Sports container not found');
    return;
  }
  
  // Clear existing sports
  container.innerHTML = '';
  
  // Add each sport
  sportsList.forEach((sport, index) => {
    const isSelected = index === 1; // Basketball selected by default (index 1)
    container.innerHTML += generateSportElement(sport, isSelected);
  });
}

// Your sports list - MODIFY THIS ARRAY TO ADD/REMOVE SPORTS
const yourSportsList = [
  'Football',
  'Basketball', 
  'Tennis',
  'Volleyball',
  'Fitness',
  'Badminton',
  'Table Tennis',
  'Swimming',
  'Climbing',
  'Cycling',
  'Running',
  'Boxing',
  'Golf',
  'Yoga',
  'Dancing',
 
];

// Generate sports when page loads
document.addEventListener('DOMContentLoaded', function() {
  addSportsToPage(yourSportsList);
  initializeToggleFilters();
});

// Initialize toggle functionality for sort options
function initializeToggleFilters() {
  // Store the last clicked radio button for each group
  let lastClicked = {
    'price-sort': null,
    'rating-sort': null,
    'distance-sort': null
  };

  // Add click event listeners to all sort option labels
  document.querySelectorAll('.sort-option').forEach(sortOption => {
    const input = sortOption.querySelector('input[type="radio"]');
    const label = sortOption.querySelector('span');
    
    if (input && input.name.includes('sort')) {
      sortOption.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default radio button behavior
        
        const groupName = input.name;
        const isCurrentlyChecked = input.checked;
        
        // If this radio button is already checked (clicked again)
        if (isCurrentlyChecked && lastClicked[groupName] === input.id) {
          // Uncheck it
          input.checked = false;
          lastClicked[groupName] = null;
          
          // Trigger change event for any listeners
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // Check this radio button and uncheck others in the group
          document.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
            radio.checked = false;
          });
          input.checked = true;
          lastClicked[groupName] = input.id;
          
          // Trigger change event for any listeners
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
  });
}

// Function to add new sport dynamically
function addNewSport(sportName) {
  const container = document.querySelector('.sports-scroll');
  if (container) {
    container.innerHTML += generateSportElement(sportName);
  }
}

// Function to get currently selected sport
function getSelectedSport() {
  const selectedInput = document.querySelector('input[name="sport"]:checked');
  if (selectedInput) {
    const label = document.querySelector(`label[for="${selectedInput.id}"]`);
    if (label) {
      return label.querySelector('span:last-child').textContent;
    }
  }
  return null;
}

// Function to select a specific sport
function selectSport(sportName) {
  const sportId = `sport-${sportName.toLowerCase().replace(/\s+/g, '')}`;
  const input = document.getElementById(sportId);
  if (input) {
    input.checked = true;
  }
}

// Function to get all filter states
function getFilterStates() {
  const filters = {
    sport: getSelectedSport(),
    priceSort: document.querySelector('input[name="price-sort"]:checked')?.id || null,
    ratingSort: document.querySelector('input[name="rating-sort"]:checked')?.id || null,
    distanceSort: document.querySelector('input[name="distance-sort"]:checked')?.id || null,
    selectedCities: Array.from(document.querySelectorAll('input[name="cities"]:checked')).map(input => 
      document.querySelector(`label[for="${input.id}"] span`).textContent
    )
  };
  return filters;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSportIcon,
    generateSportElement,
    addSportsToPage,
    addNewSport,
    getSelectedSport,
    selectSport,
    getFilterStates,
    sportIconMap,
    yourSportsList
  };
}