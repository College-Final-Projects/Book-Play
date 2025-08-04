let currentChatUser = null; // المستخدم الحالي في الدردشة

// عند تحميل الصفحة، جلب المحادثات
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

// تحميل المحادثة عند النقر
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

// إرسال الرسالة عند الضغط على زر "Send" أو Enter
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
