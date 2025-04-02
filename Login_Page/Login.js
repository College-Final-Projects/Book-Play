// login.js
import { app } from '../firebase-config.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

const auth = getAuth(app);

// Define loginUser function and attach it to window so HTML can call it
window.loginUser = async function () {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Logged in:", user.email);

    // Redirect after successful login
    window.location.href = '../User_Selection_Page/user-selection.html';
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};
