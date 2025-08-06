let currentChatUser = null; // Current user in chat

// When page loads, fetch conversations
window.addEventListener('DOMContentLoaded', () => {
  fetch("fetch_conversations.php")
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

  fetch(`fetch_messages.php?chat_with=${encodeURIComponent(username)}`)
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

    fetch("send_message.php", {
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
