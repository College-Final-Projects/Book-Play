function showSection(section) {
    const chatsBtn = document.getElementById("chatsBtn");
    const friendsBtn = document.getElementById("friendsBtn");
    const chatSection = document.getElementById("chatSection");
    const friendsSection = document.getElementById("friendsSection");

    if (section === 'chats') {
      chatSection.style.display = "flex";
      friendsSection.style.display = "none";
      chatsBtn.classList.add("active");
      friendsBtn.classList.remove("active");
    } else {
      chatSection.style.display = "none";
      friendsSection.style.display = "block";
      friendsBtn.classList.add("active");
      chatsBtn.classList.remove("active");
    }
  }

  function filterFriends() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const friends = document.querySelectorAll(".friend-row");

    friends.forEach(row => {
      const name = row.querySelector(".friend-name").textContent.toLowerCase();
      row.style.display = name.includes(input) ? "flex" : "none";
    });
  }

  function viewProfile(name) {
    alert("Viewing profile for: " + name);
  }

  function messageUser(name) {
    alert("Messaging: " + name);
  }

  // Optionally start on chats
  window.onload = function () {
    showSection('chats');
  };