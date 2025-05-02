let currentMonth = 'January';

  const bookingsData = {
    January: [
      { date: '01/01', bookings: 4, total: 400 },
      { date: '02/01', bookings: 2, total: 200 },
      { date: '03/01', bookings: 5, total: 500 },
    ],
    February: [
      { date: '01/02', bookings: 3, total: 300 },
      { date: '02/02', bookings: 1, total: 100 },
    ],
    All: [
      { date: 'Jan', bookings: 11, total: 1100 },
      { date: 'Feb', bookings: 4, total: 400 },
    ]
  };

  function openBookings(venueName) {
    document.getElementById("cardSection").style.display = "none";
    document.getElementById("bookingPage").style.display = "flex";
    document.getElementById("venueTitle").textContent = "Bookings for " + venueName;
    showMonth("January");
  }

  function goBack() {
    document.getElementById("bookingPage").style.display = "none";
    document.getElementById("cardSection").style.display = "block";
  }

  function showMonth(month) {
    currentMonth = month;
    let table = document.getElementById("bookingTable");
    let summary = document.getElementById("summaryRow");
    table.innerHTML = '';
    let data = bookingsData[month] || [];
    let totalBookings = 0, totalMoney = 0;

    data.forEach(entry => {
      table.innerHTML += `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.bookings}</td>
          <td>${entry.total}₪</td>
        </tr>
      `;
      totalBookings += entry.bookings;
      totalMoney += entry.total;
    });

    summary.innerHTML = `
      <span>Total Bookings: ${totalBookings}</span>
      <span>Total Revenue: ₪${totalMoney}</span>
    `;
    
    document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.month-btn')).find(b => b.textContent === month);
    if (activeBtn) activeBtn.classList.add('active');
  }
  
  function downloadPDF() {
  const element = document.getElementById("pdfContent"); // نأخذ العنصر الذي نريد طباعته
  const opt = {
    margin:       0.5, // الهوامش
    filename:     'bookings-report.pdf', // اسم الملف
    image:        { type: 'jpeg', quality: 0.98 }, // إعدادات الصورة
    html2canvas:  { scale: 2 }, // جودة الصورة
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' } // تنسيق PDF
  };
  html2pdf().set(opt).from(element).save(); // إنشاء وحفظ PDF
}
