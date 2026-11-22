function isValidContact(value) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^[\+]?[\d\s\-\(\)]{7,}$/;
  return emailRe.test(value) || phoneRe.test(value);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const contact = document.getElementById('contact-contact').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (name.length < 2) {
      showStatus('Введите имя', 'error');
      return;
    }

    if (!isValidContact(contact)) {
      showStatus('Введите корректный email или телефон', 'error');
      return;
    }

    if (message.length < 5) {
      showStatus('Введите сообщение (минимум 5 символов)', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, message })
      });

      const data = await res.json();

      if (data.success) {
        showStatus(`Спасибо, ${name}! Сообщение отправлено. Я свяжусь с вами в ближайшее время.`, 'success');
        form.reset();
      } else {
        showStatus(data.error || 'Не удалось отправить сообщение', 'error');
      }
    } catch (err) {
      console.error('Ошибка отправки:', err);
      showStatus('Ошибка соединения с сервером', 'error');
    }
  });

  function showStatus(text, type) {
    status.textContent = text;
    status.style.color = type === 'success' ? '#2a7' : '#c00';
    status.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 5000);
    }
  }
});