async function loadReviews() {
  const grid = document.getElementById('reviews-grid');
  const allGrid = document.getElementById('all-reviews-grid');

  try {
    // На главной — только топ-3 последних
    if (grid) {
      const reviews = await API.getReviews();
      if (reviews.length === 0) {
        grid.innerHTML = '<p style="color:#888;">Пока нет отзывов</p>';
      } else {
        grid.innerHTML = reviews.map(reviewCardHtml).join('');
      }
    }

    // На странице reviews.html — все опубликованные
    if (allGrid) {
      const all = await API.getAllReviews();
      if (all.length === 0) {
        allGrid.innerHTML = '<p style="color:#888;">Пока нет опубликованных отзывов</p>';
      } else {
        allGrid.innerHTML = all.map(reviewCardHtml).join('');
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
  }
}

function reviewCardHtml(r) {
  return `
    <article class="review-card">
      <div class="stars">${'★'.repeat(r.Rating)}${'☆'.repeat(5 - r.Rating)}</div>
      <h4>${r.AuthorName}</h4>
      <p class="review-text">${r.ReviewText}</p>
      <div class="review-author">
        <div class="review-avatar"></div>
        <div class="review-author-info">
          <span class="review-author-name">${r.AuthorName}</span>
          <span class="review-date">${formatDate(r.CreatedAt)}</span>
        </div>
      </div>
    </article>`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadReviews();

  const form = document.getElementById('review-form');
  const status = document.getElementById('rf-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const authorName = document.getElementById('rf-name').value.trim();
      const rating = document.getElementById('rf-rating').value;
      const reviewText = document.getElementById('rf-text').value.trim();

      if (authorName.length < 2) {
        showStatus('Введите имя', 'error'); return;
      }
      if (!rating) {
        showStatus('Выберите оценку', 'error'); return;
      }
      if (reviewText.length < 5) {
        showStatus('Введите текст отзыва (минимум 5 символов)', 'error'); return;
      }

      const result = await API.createReview({ authorName, reviewText, rating: Number(rating) });

      if (result.success) {
        showStatus('Спасибо! Отзыв отправлен и появится после проверки.', 'success');
        form.reset();
      } else {
        showStatus(result.error || 'Ошибка отправки', 'error');
      }
    });

    function showStatus(text, type) {
      status.textContent = text;
      status.style.color = type === 'success' ? '#2a7' : '#c00';
      status.style.display = 'block';
      if (type === 'success') setTimeout(() => status.style.display = 'none', 6000);
    }
  }
});