fetch('../player.html')
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body.innerHTML;
    document.body.innerHTML = bodyContent; // استبدل محتوى الصفحة بالكامل
  });
  