const ADMIN_API = 'http://localhost:3000/api';

const AdminAPI = {
  getToken() { return localStorage.getItem('nvphotos_admin_token'); },
  headers() { return { 'Authorization': 'Bearer ' + this.getToken() }; },
  jsonHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken() }; },

  async get(path) {
    const res = await fetch(`${ADMIN_API}${path}`, { headers: this.headers() });
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(`${ADMIN_API}${path}`, { method: 'POST', headers: this.jsonHeaders(), body: JSON.stringify(data) });
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(`${ADMIN_API}${path}`, { method: 'PUT', headers: this.jsonHeaders(), body: JSON.stringify(data) });
    return res.json();
  },
  async del(path) {
    const res = await fetch(`${ADMIN_API}${path}`, { method: 'DELETE', headers: this.headers() });
    return res.json();
  }
};

function renderHeader() {
  const html = `
    <header>
      <div class="container header-inner">
        <a href="../index.html" class="logo">
          <img class="logo-icon" src="../img/logo.jpg" alt="NVPhotos">
          NVPhotos
        </a>
        <div class="header-actions">
          <span id="admin-name" style="color:#888;"></span>
          <a href="#" id="logout-link">Выйти</a>
        </div>
      </div>
    </header>
  `;
  document.getElementById('header-slot').innerHTML = html;
}

function renderLayoutShell(activeSlug, mainHtml) {
  document.getElementById('layout-slot').innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <ul>
          <li><a href="services.html" class="${activeSlug === 'services' ? 'active' : ''}">Услуги</a></li>
          <li><a href="orders.html" class="${activeSlug === 'orders' ? 'active' : ''}">Заказы</a></li>
          <li><a href="promocodes.html" class="${activeSlug === 'promocodes' ? 'active' : ''}">Промокоды</a></li>
          <li><a href="reviews.html" class="${activeSlug === 'reviews' ? 'active' : ''}">Отзывы</a></li>
          <li><a href="portfolio.html" class="${activeSlug === 'portfolio' ? 'active' : ''}">Портфолио</a></li>
          <li><a href="achievements.html" class="${activeSlug === 'achievements' ? 'active' : ''}">Достижения</a></li>
          <li><a href="contacts.html" class="${activeSlug === 'contacts' ? 'active' : ''}">Сообщения</a></li>
        </ul>
      </aside>
      <main class="admin-main">
        ${mainHtml}
      </main>
    </div>
  `;
}

function bindLogout() {
  const link = document.getElementById('logout-link');
  if (!link) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('nvphotos_admin_token');
    localStorage.removeItem('nvphotos_admin_login');
    window.location.href = '../login.html';
  });
}

function bindModalClose() {
  const closeBtn = document.getElementById('admin-modal-close');
  const modal = document.getElementById('admin-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target.id === 'admin-modal') closeModal(); });
}

function openModal(title, fieldsHtml, onSubmit) {
  const modal = document.getElementById('admin-modal');
  document.getElementById('admin-modal-title').textContent = title;
  const form = document.getElementById('admin-form');
  form.innerHTML = fieldsHtml + `<button type="submit" class="checkout-btn">Сохранить</button>`;
  form.onsubmit = async (e) => {
    e.preventDefault();
    await onSubmit();
  };
  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('admin-modal').classList.remove('open');
}

async function adminInit(activeSlug, onReady) {
  const token = localStorage.getItem('nvphotos_admin_token');
  if (!token) { window.location.href = '../login.html'; return; }

  try {
    const res = await fetch(`${ADMIN_API}/auth/me`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) {
      localStorage.removeItem('nvphotos_admin_token');
      window.location.href = '../login.html';
      return;
    }
    const login = localStorage.getItem('nvphotos_admin_login');
    document.getElementById('admin-name').textContent = login || 'admin';
  } catch (err) {
    console.error(err);
    window.location.href = '../login.html';
    return;
  }

  renderHeader();
  bindLogout();
  bindModalClose();

  if (onReady) await onReady();
}