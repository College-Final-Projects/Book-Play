

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