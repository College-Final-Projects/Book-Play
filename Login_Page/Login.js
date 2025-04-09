// تنفيذ الكود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة مستمع الحدث لزر تسجيل الدخول
    document.querySelector('.btn-primary').addEventListener('click', loginUser);
    
    // إضافة استماع لحدث الضغط على Enter في حقول النموذج
    document.getElementById('loginForm').addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loginUser();
      }
    });
  });
  
  function loginUser() {
    // إخفاء أي رسائل خطأ سابقة
    document.getElementById('errorMessage').textContent = '';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // إنشاء كائن FormData لإرسال البيانات
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    // إظهار رسالة للمستخدم أثناء المعالجة
    document.getElementById('errorMessage').textContent = 'جاري التحقق من البيانات...';
    
    // إرسال طلب AJAX إلى صفحة PHP للتحقق من بيانات تسجيل الدخول
    fetch('login_process.php', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // إذا كان تسجيل الدخول ناجحاً
        window.location.href = 'dashboard.php'; // توجيه المستخدم إلى لوحة التحكم
      } else {
        // إذا فشل تسجيل الدخول
        document.getElementById('errorMessage').textContent = data.message;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('errorMessage').textContent = 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.';
    });
  }