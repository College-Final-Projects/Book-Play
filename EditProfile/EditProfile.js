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

  input.value = "";
  preview.src = "#";
  preview.style.display = "none";
  removeBtn.style.display = "none";
};

// التحقق من أن الهاتف يحتوي فقط على أرقام (داخل oninput أيضاً)
document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
  });

  // يمكنك إضافة أي تحقق إضافي آخر هنا لاحقًا
});
