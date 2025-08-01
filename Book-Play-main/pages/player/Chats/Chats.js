let currentChatUser = null; // المستخدم الحالي في الدردشة

// عند تحميل الصفحة، جلب المحادثات
window.addEventListener('DOMContentLoaded', () => {
  console.log("Loading conversations...");
  fetch("fetch_conversations.php")
    .then(response => {
      console.log("Response status:", response.status);
      return response.json();
    })
    .then(data => {
      console.log("Conversations data:", data);
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
      } else {
        console.error("Failed to load conversations:", data.message);
      }
    })
    .catch(error => {
      console.error("Error loading conversations:", error);
    });
});

// تحميل المحادثة عند النقر
function loadChat(username) {
  console.log("Loading chat with:", username);
  currentChatUser = username;
  document.getElementById("chatHeader").textContent = username;

  fetch(`fetch_messages.php?chat_with=${encodeURIComponent(username)}`)
    .then(res => {
      console.log("Load chat response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("Load chat data:", data);
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
      } else {
        console.error("Failed to load chat:", data.message);
      }
    })
    .catch(error => {
      console.error("Error loading chat:", error);
    });
}

// إرسال الرسالة عند الضغط على زر "Send" أو Enter
document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentChatUser) {
      console.log("Cannot send message - message:", message, "currentChatUser:", currentChatUser);
      return;
    }

    console.log("Sending message to:", currentChatUser, "message:", message);

    fetch("send_message.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receiver: currentChatUser,
        message: message
      })
    })
      .then(res => {
        console.log("Send message response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Send message response:", data);
        if (data.success) {
          const chatBody = document.getElementById("chatBody");
          const msg = document.createElement("p");
          msg.className = "message right";
          msg.textContent = message;
          chatBody.appendChild(msg);
          messageInput.value = "";
          console.log("Message sent successfully");
        } else {
          console.error("Failed to send message:", data.message);
          alert("❌ Failed to send message: " + data.message);
        }
      })
      .catch(error => {
        console.error("Error sending message:", error);
        alert("❌ Error sending message: " + error.message);
      });
  }

  // عند الضغط على زر Send
  sendButton.addEventListener("click", sendMessage);

  // عند الضغط على Enter
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
