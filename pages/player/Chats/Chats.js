let currentChatUser = null; // Current user in chat

// When page loads, fetch conversations
window.addEventListener('DOMContentLoaded', () => {
  fetch("ChatsAPI.php?action=list_conversations")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const sidebar = document.getElementById("sidebar");
        sidebar.innerHTML = "";

        data.users.forEach(user => {
          const userDiv = document.createElement("div");
          userDiv.className = "user-entry";
          
          const usernameDiv = document.createElement("div");
          usernameDiv.className = "user-name";
          usernameDiv.textContent = user.username;
          
          const lastMessageDiv = document.createElement("div");
          lastMessageDiv.className = "last-message";
          lastMessageDiv.textContent = user.last_message;
          
          userDiv.appendChild(usernameDiv);
          userDiv.appendChild(lastMessageDiv);
          userDiv.onclick = () => loadChat(user.username);
          sidebar.appendChild(userDiv);
        });

        // Check if there's a user parameter in the URL (from FindPlayer page)
        const urlParams = new URLSearchParams(window.location.search);
        const targetUser = urlParams.get('user');
        
        if (targetUser) {
          // Find the user in the sidebar and automatically select them
          const userEntries = document.querySelectorAll('.user-entry');
          let userFound = false;
          
          userEntries.forEach(entry => {
            const username = entry.querySelector('.user-name').textContent;
            if (username === targetUser) {
              userFound = true;
              // Simulate a click on this user to load their chat
              entry.click();
            }
          });
          
          // If user not found in existing conversations, create a new conversation
          if (!userFound) {
            // Create a new user entry for this user
            const userDiv = document.createElement("div");
            userDiv.className = "user-entry";
            
            const usernameDiv = document.createElement("div");
            usernameDiv.className = "user-name";
            usernameDiv.textContent = targetUser;
            
            const lastMessageDiv = document.createElement("div");
            lastMessageDiv.className = "last-message";
            lastMessageDiv.textContent = "Start a new conversation";
            
            userDiv.appendChild(usernameDiv);
            userDiv.appendChild(lastMessageDiv);
            userDiv.onclick = () => loadChat(targetUser);
            sidebar.appendChild(userDiv);
            
            // Automatically select this new user
            userDiv.click();
          }
        }
      }
    });
});

// Load conversation when clicked
function loadChat(username) {
  currentChatUser = username;
  document.getElementById("chatHeader").textContent = username;
  
  // Remove active class from all user entries
  document.querySelectorAll('.user-entry').forEach(entry => {
    entry.classList.remove('active');
  });
  
  // Add active class to clicked user entry
  event.target.closest('.user-entry').classList.add('active');

  fetch(`ChatsAPI.php?action=list_messages&chat_with=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
      const chatBody = document.getElementById("chatBody");
      chatBody.innerHTML = "";

      if (data.success) {
        data.messages.forEach(msg => {
          const messageElement = document.createElement("p");
          messageElement.classList.add("message");

          if (msg.sender_username === sessionUsername) {
            messageElement.classList.add("right");
          }

          messageElement.textContent = msg.message_text;
          chatBody.appendChild(messageElement);
        });
      }
    });
}

// Send message when pressing "Send" button or Enter
document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentChatUser) return;

    fetch("ChatsAPI.php?action=send_message", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receiver: currentChatUser,
        message: message
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const chatBody = document.getElementById("chatBody");
          const msg = document.createElement("p");
          msg.className = "message right";
          msg.textContent = message;
          chatBody.appendChild(msg);
          messageInput.value = "";
        } else {
          alert("❌ Failed to send message.");
        }
      });
  }

  // When pressing Send button
  sendButton.addEventListener("click", sendMessage);

  // When pressing Enter
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
