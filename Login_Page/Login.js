document.getElementById("loginButton").addEventListener("click", function (event) {
    event.preventDefault(); // منع إعادة تحميل الصفحة

    let email = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (email === "" || password === "") {
        alert("⚠️ Please fill in all fields.");
        return;
    }

    fetch("login.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
        let messageBox = document.getElementById("loginMessage");
        messageBox.innerText = data.message;
        messageBox.style.color = data.status === "success" ? "green" : "red";

        if (data.status === "success") {
            setTimeout(() => {
                window.location.href = "dashboard.php"; // إعادة التوجيه بعد نجاح تسجيل الدخول
            }, 1500);
        }
    })
    .catch(error => console.error("Error:", error));
});
