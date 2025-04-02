let currentStep = 1;

function nextStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove("active");
    document.getElementById(`step${step}`).classList.add("active");
    currentStep = step;
}

// إرسال البريد والتحقق من وجوده في قاعدة البيانات
document.getElementById("sendCodeButton").addEventListener("click", function() {
    let email = document.getElementById("email").value;
    let errorMessage = document.getElementById("emailError");

    errorMessage.textContent = ""; // مسح أي خطأ سابق

    if (!email) {
        errorMessage.textContent = "Please enter your email!";
        return;
    }

    fetch("send_code.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=" + encodeURIComponent(email)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            nextStep(2);
        } else {
            errorMessage.textContent = data.message;
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
});

// التحقق من تطابق كلمات المرور قبل إعادة التعيين
document.getElementById("resetForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let pass = document.getElementById("password").value;
    let confirmPass = document.getElementById("confirmPassword").value;
    let errorMessage = document.getElementById("error");

    if (pass !== confirmPass) {
        errorMessage.textContent = "Passwords do not match!";
    } else {
        alert("Password Reset Successfully!");
    }
});
