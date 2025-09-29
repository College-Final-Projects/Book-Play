let currentChatUser = null; // Current user in chat

// When page loads, fetch conversations
window.addEventListener('DOMContentLoaded', () => {
  fetch("MessagesAPI.php?action=get_conversations")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const sidebar = document.getElementById("sidebar");
        sidebar.innerHTML = "";

        data.users.forEach(username => {
          const userDiv = document.createElement("div");
          userDiv.className = "user-entry";
          userDiv.textContent = username;
          userDiv.onclick = () => loadChat(username);
          sidebar.appendChild(userDiv);
        });
      }
    });
});

// Load conversation when clicked
function loadChat(username) {
  currentChatUser = username;
  document.getElementById("chatHeader").textContent = username;

  fetch(`MessagesAPI.php?action=get_messages&chat_with=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
      const chatBody = document.getElementById("chatBody");
      chatBody.innerHTML = "";

      if (data.success) {
        data.messages.forEach(msg => {
          const messageDiv = document.createElement("div");
          messageDiv.classList.add("message");

          if (msg.sender_username === sessionUsername) {
            messageDiv.classList.add("right");
          } else {
            messageDiv.classList.add("left");
          }

          // Create message content
          messageDiv.textContent = msg.message_text;

          chatBody.appendChild(messageDiv);
        });
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
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

    fetch("MessagesAPI.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "send_message",
        receiver: currentChatUser,
        message: message
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const chatBody = document.getElementById("chatBody");
          const messageDiv = document.createElement("div");
          messageDiv.classList.add("message", "right");
          messageDiv.textContent = message;
          
          chatBody.appendChild(messageDiv);
          messageInput.value = "";
          chatBody.scrollTop = chatBody.scrollHeight;
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
