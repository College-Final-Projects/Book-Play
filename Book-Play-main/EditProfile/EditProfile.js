// معاينة صورة البروفايل عند التحميل
window.previewImage = function () {
  const input = document.getElementById("profileImage");
  const preview = document.getElementById("profileImagePreview");
  const removeBtn = document.getElementById("removeImageBtn");

  const file = input.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    removeBtn.style.display = "inline-block";
  }
};

window.removeImage = function () {
  const input = document.getElementById("profileImage");
  const preview = document.getElementById("profileImagePreview");
  const removeBtn = document.getElementById("removeImageBtn");

  // تنظيف الواجهة
  input.value = "";
  preview.src = "#";
  preview.style.display = "none";
  removeBtn.style.display = "none";

  // إرسال الطلب لحذف الصورة من قاعدة البيانات
  fetch("EditProfile.php?action=remove_image")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        alert("⚠️ Failed to remove image from database.");
      }
    })
    .catch(() => {
      alert("⚠️ Error occurred while removing the image.");
    });
};


// التحقق من أن الهاتف يحتوي فقط على أرقام (داخل oninput أيضاً)
document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").slice(0, 10);
  });

  // يمكنك إضافة أي تحقق إضافي آخر هنا لاحقًا
});
document.addEventListener("DOMContentLoaded", function () {
  fetch("EditProfile.php?action=get_user_data")
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.user) {
        const u = data.user;
        document.getElementById("firstName").value = u.first_name || "";
        document.getElementById("lastName").value = u.last_name || "";
        document.getElementById("username").value = u.username || "";
        document.getElementById("age").value = u.age || "";
        document.getElementById("gender").value = u.Gender || "";
        document.getElementById("phone").value = u.phone_number || "";
        document.getElementById("description").value = u.description || "";

        if (u.user_image) {
          const imgPath = `../uploads/users/${u.user_image}`;
          const preview = document.getElementById("profileImagePreview");
          const removeBtn = document.getElementById("removeImageBtn");
          preview.src = imgPath;
          preview.style.display = "block";
          removeBtn.style.display = "inline-block";
        }
      }
    })
    .catch((err) => console.error("❌ Error loading profile:", err));
});
// إظهار النافذة بعد الحفظ
function showModal() {
  const modal = document.getElementById("confirmationModal");
  if (modal) modal.style.display = "flex";
}

// إغلاق النافذة عند الضغط على OK
window.closeModal = function () {
  const modal = document.getElementById("confirmationModal");
  if (modal) {
    modal.style.display = "none";
    window.location.href = "EditProfile.php"; // إعادة التوجيه بعد الإغلاق
  }
};
function goBack() {
  fetch("EditProfile.php?action=prev")
    .then((res) => res.json())
    .then((data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        history.back();
      }
    });
}
