let currentCategory = null;

async function loadPortfolioFilters() {
  const filters = document.getElementById('portfolio-filters');
  if (!filters) return;

  try {
    const categories = await API.getPortfolioCategories();
    let html = `<button class="portfolio-filter active" data-slug="">Все работы</button>`;
    html += categories.map(c => `<button class="portfolio-filter" data-slug="${c.Slug}">${c.Name}</button>`).join('');
    filters.innerHTML = html;

    filters.querySelectorAll('.portfolio-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.querySelectorAll('.portfolio-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.slug;
        loadPortfolio();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  try {
    const items = currentCategory
      ? await API.getPortfolioByCategory(currentCategory)
      : await API.getPortfolio();

    if (items.length === 0) {
      grid.innerHTML = '<p style="color:#888;">Нет работ в этой категории</p>';
      return;
    }

    grid.innerHTML = items.map(item => {
      // Формируем правильный путь к картинке
      const src = item.ImageUrl.startsWith('/img/')
        ? `http://localhost:3000${item.ImageUrl}`
        : item.ImageUrl;

      return `
        <article class="portfolio-card">
          <img class="portfolio-img" src="${src}" alt="${item.Title || 'Работа'}" data-full="${src}">
        </article>
      `;
    }).join('');

    // Навешиваем обработчики клика для лайтбокса
    grid.querySelectorAll('.portfolio-img').forEach(img => {
      img.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        
        // Берем полный путь из data-full (или оригинальный src)
        lightboxImg.src = img.dataset.full || img.src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // Запрещаем скролл фона
      });
    });

  } catch (err) {
    console.error('Ошибка загрузки портфолио:', err);
    grid.innerHTML = '<p style="color:#888;">Не удалось загрузить портфолио</p>';
  }
}

// Логика закрытия лайтбокса
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightboxClose) {
    // Закрытие по крестику
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    });

    // Закрытие по клику на темный фон
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Закрытие по нажатию Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Загружаем фильтры и работы
  loadPortfolioFilters();
  loadPortfolio();
});