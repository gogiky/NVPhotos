function formatPrice(price, unit) {
  if (unit === 'рублей/час') return `${price} рублей/час`;
  return `${price} рублей`;
}

async function renderPopularServices() {
  const track = document.getElementById('popular-track');
  if (!track) return;

  const services = await API.getPopularServices();

  if (services.length === 0) {
    track.innerHTML = '<p style="color:#fff;">Пока нет популярных услуг</p>';
    return;
  }

  // Дублируем карточки 3 раза для бесконечной прокрутки
  const doubled = [...services, ...services, ...services];

  track.innerHTML = doubled.map((s, idx) => `
    <article class="popular-card" data-id="${s.Id}" data-index="${idx}">
      <h3>${s.Title}</h3>
      <img class="popular-img" src="${s.ImageUrl}" alt="${s.Title}">
      <p>${s.Description || ''}</p>
      <button class="order-btn add-to-cart"
              data-id="${s.Id}"
              data-title="${s.Title}"
              data-price="${s.Price}">
        Оформить заказ
      </button>
    </article>
  `).join('');
}

async function renderAllServices() {
  const grid = document.getElementById('all-services-grid');
  if (!grid) return;

  const services = await API.getServices();

  if (services.length === 0) {
    grid.innerHTML = '<p style="color:#888; text-align:center;">Услуг пока нет</p>';
    return;
  }

  grid.innerHTML = services.map(s => `
    <article class="all-service-card" data-title="${s.Title.toLowerCase()}">
      <img class="all-service-img" src="${s.ImageUrl}" alt="${s.Title}">
      <div class="all-service-body">
        <h4>${s.Title}</h4>
        <p class="all-service-desc">${s.Description || ''}</p>
        <div class="all-service-footer">
          <span class="price">${formatPrice(s.Price, s.PriceUnit)}</span>
          <button class="order-btn-small add-to-cart"
                  data-id="${s.Id}"
                  data-title="${s.Title}"
                  data-price="${s.Price}">
            В корзину
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function bindSearch() {
  const input = document.getElementById('service-search');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.all-service-card').forEach(card => {
      const title = card.dataset.title;
      card.style.display = title.includes(query) ? '' : 'none';
    });
  });
}

function bindAddToCart() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
      Cart.add(
        Number(btn.dataset.id),
        btn.dataset.title,
        Number(btn.dataset.price)
      );

      const original = btn.textContent;
      btn.textContent = 'Добавлено ✓';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('added');
      }, 1200);
    });
  });
}

/* ===== Бесконечный слайдер ===== */
function initSlider() {
  const track = document.getElementById('popular-track');
  const prev = document.getElementById('slider-prev');
  const next = document.getElementById('slider-next');
  if (!track || !prev || !next) return;

  const realCount = track.children.length / 3; // так как утроили
  let index = realCount; // начинаем со второй копии (середина)
  let animating = false;

  function cardWidth() {
    const card = track.querySelector('.popular-card');
    if (!card) return 0;
    const gap = 24;
    return card.offsetWidth + gap;
  }

  function setTransform(noTransition = false) {
    if (noTransition) track.style.transition = 'none';
    track.style.transform = `translateX(-${index * cardWidth()}px)`;
    if (noTransition) {
      // форсируем reflow, чтобы браузер применил «мгновенно»
      void track.offsetWidth;
      track.style.transition = '';
    }
  }

  function nextSlide() {
    if (animating) return;
    animating = true;
    index++;
    setTransform();
    track.addEventListener('transitionend', onEnd);
  }

  function prevSlide() {
    if (animating) return;
    animating = true;
    index--;
    setTransform();
    track.addEventListener('transitionend', onEnd);
  }

  function onEnd() {
    track.removeEventListener('transitionend', onEnd);

    // Если ушли за пределы второй копии — сдвигаем в эквивалентную позицию
    if (index >= realCount * 2) {
      index = realCount;
      setTransform(true);
    } else if (index < realCount) {
      index = realCount * 2 - 1;
      setTransform(true);
    }

    animating = false;
  }

  prev.addEventListener('click', prevSlide);
  next.addEventListener('click', nextSlide);

  window.addEventListener('resize', () => {
    setTransform(true);
  });

  // авто-инициализация
  setTransform(true);
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderPopularServices();
  await renderAllServices();
  bindSearch();
  bindAddToCart();
  initSlider();
});