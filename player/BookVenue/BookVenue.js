// bookvenue.js

// Toggle sidebar
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Scroll venue cards
function scrollCards(direction) {
  const container = document.getElementById("cards");
  const scrollAmount = 270;
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// Firebase integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDp6sRLFKnZz_sv3sY6pBCDnI8NBjEf7Q4",
  authDomain: "book-play-7bf69.firebaseapp.com",
  databaseURL: "https://book-play-7bf69-default-rtdb.firebaseio.com",
  projectId: "book-play-7bf69",
  storageBucket: "book-play-7bf69.appspot.com",
  messagingSenderId: "438796480566",
  appId: "1:438796480566:web:cd765aa61ca4e67e11e897",
  measurementId: "G-VV843XX2PL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Load categories dynamically
const dbRef = ref(db);
get(child(dbRef, "sports")).then((snapshot) => {
  if (snapshot.exists()) {
    const list = document.getElementById("categoryList");
    snapshot.forEach(child => {
      const name = child.val().name;
      const li = document.createElement("li");
      li.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      list.appendChild(li);
    });
  } else {
    console.log("No sports found.");
  }
}).catch((error) => {
  console.error("Firebase error:", error);
});
