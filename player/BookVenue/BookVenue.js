const sportsList = document.getElementById("sportsList");
const sportsRef = firebase.database().ref("sports");
const slider = document.getElementById("facilitySlider");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

// Toggle sidebar visibility
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

// Load sports from Firebase
sportsRef.on("value", (snapshot) => {
  sportsList.innerHTML = "";
  const data = snapshot.val();
  if (data) {
    Object.values(data).forEach((sport) => {
      const li = document.createElement("li");
      li.textContent = sport.name;
      sportsList.appendChild(li);
    });
  }
});
