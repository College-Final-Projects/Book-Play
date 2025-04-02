// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDp6sRLFKnZz_sv3sY6pBCDnI8NBjEf7Q4",
  authDomain: "book-play-7bf69.firebaseapp.com",
  databaseURL: "https://book-play-7bf69-default-rtdb.firebaseio.com",
  projectId: "book-play-7bf69",
  storageBucket: "book-play-7bf69.firebasestorage.app",
  messagingSenderId: "438796480566",
  appId: "1:438796480566:web:cd765aa61ca4e67e11e897",
  measurementId: "G-VV843XX2PL"
};

// Initialize Firebase App once and export the database
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);