const ADMIN_API = 'http://localhost:3000/api';

const AdminAPI = {
  getToken() { return localStorage.getItem('nvphotos_admin_token'); },
  headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.getToken()
    };
  },
  async get(path) {
    const res = await fetch(`${ADMIN_API}${path}`, { headers: this.headers() });
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(`${ADMIN_API}${path}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(`${ADMIN_API}${path}`, {
      method: 'PUT', headers: this.headers(), body: JSON.stringify(data)
    });
    return res.json();
  },
  async del(path) {
    const res = await fetch(`${ADMIN_API}${path}`, {
      method: 'DELETE', headers: this.headers()
    });
    return res.json();
  }
};

let categoriesCache = [];

/* ===== Переключение вкладок ===== */
function switchTab(tabName) {
  console.log('switchTab:', tabName);

  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
  if (tab) tab.classList.add('active');

  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('tab-' + tabName);
  if (section) section.classList.add('active');

  if (tabName === 'services') loadServices();
  if (tabName === 'orders') loadOrders();
  if (tabName === 'promocodes') loadPromocodes();
  if (tabName === 'reviews') loadReviews();
  if (tabName === 'portfolio') loadPortfolio();
  if (tabName === 'achievements') loadAchievements();
  if (tabName === 'contacts') loadContacts();
}

/* ===== Загрузки ===== */
async function loadServices() {
  const tbody = document.getElementById('services-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/services');

  tbody.innerHTML = items.map(s => `
    <tr>
      <td>${s.Id}</td>
      <td>${s.Title}</td>
      <td>${s.Price} ${s.PriceUnit || ''}</td>
      <td>${s.IsPopular ? 'Да' : '—'}</td>
      <td>${s.IsActive ? 'Да' : 'Нет'}</td>
      <td>${s.SortOrder}</td>
      <td>
        <button class="btn-small btn-edit" data-action="edit-service" data-id="${s.Id}">Изменить</button>
        <button class="btn-small btn-delete" data-action="delete-service" data-id="${s.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  bindRowActions('services-tbody', 'edit-service', openServiceForm);
  bindRowActions('services-tbody', 'delete-service', removeService);
}

async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/orders');

  tbody.innerHTML = items.map(o => `
    <tr>
      <td>${o.Id}</td>
      <td>${o.CustomerName}</td>
      <td>${o.Phone}</td>
      <td>${o.ShootTime}</td>
      <td>${o.Total} ₽</td>
      <td>
        <select class="status-select" data-id="${o.Id}">
          ${['Новый','Подтверждён','Выполнен','Отменён'].map(st =>
            `<option ${o.Status === st ? 'selected' : ''}>${st}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-small btn-edit" data-action="save-order" data-id="${o.Id}">Сохранить</button></td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  tbody.querySelectorAll('button[data-action="save-order"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const status = tbody.querySelector(`select[data-id="${id}"]`).value;
      await AdminAPI.put(`/admin/orders/${id}/status`, { status });
      alert('Статус обновлён');
    });
  });
}

async function loadPromocodes() {
  const tbody = document.getElementById('promocodes-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/promocodes');

  tbody.innerHTML = items.map(p => `
    <tr>
      <td>${p.Id}</td>
      <td>${p.Code}</td>
      <td>${p.DiscountPercent ? p.DiscountPercent + '%' : (p.DiscountAmount || 0) + ' ₽'}</td>
      <td>${p.UsageLimit || '—'}</td>
      <td>${p.UsedCount}</td>
      <td>${p.IsActive ? 'Да' : 'Нет'}</td>
      <td>
        <button class="btn-small btn-edit" data-action="edit-promocode" data-id="${p.Id}">Изменить</button>
        <button class="btn-small btn-delete" data-action="delete-promocode" data-id="${p.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  bindRowActions('promocodes-tbody', 'edit-promocode', openPromocodeForm);
  bindRowActions('promocodes-tbody', 'delete-promocode', removePromocode);
}

async function loadReviews() {
  const tbody = document.getElementById('reviews-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/reviews');

  tbody.innerHTML = items.map(r => `
    <tr>
      <td>${r.Id}</td>
      <td>${r.AuthorName}</td>
      <td>${(r.ReviewText || '').substring(0, 60)}…</td>
      <td>${r.Rating}/5</td>
      <td>${r.IsPublished ? 'Да' : 'Нет'}</td>
      <td>
        <button class="btn-small btn-edit" data-action="toggle-review" data-id="${r.Id}" data-pub="${r.IsPublished ? 1 : 0}">
          ${r.IsPublished ? 'Снять' : 'Опубликовать'}
        </button>
        <button class="btn-small btn-delete" data-action="delete-review" data-id="${r.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  tbody.querySelectorAll('button[data-action="toggle-review"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newVal = btn.dataset.pub === '1' ? 0 : 1;
      await AdminAPI.put(`/admin/reviews/${btn.dataset.id}/publish`, { IsPublished: newVal });
      loadReviews();
    });
  });

  bindRowActions('reviews-tbody', 'delete-review', async (id) => {
    if (!confirm('Удалить отзыв?')) return;
    await AdminAPI.del(`/admin/reviews/${id}`);
    loadReviews();
  });
}

async function loadPortfolio() {
  const tbody = document.getElementById('portfolio-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/portfolio');

  tbody.innerHTML = items.map(p => `
    <tr>
      <td>${p.Id}</td>
      <td>${p.Title || '—'}</td>
      <td>${p.ImageUrl}</td>
      <td>${catName(p.CategoryId)}</td>
      <td>${p.SortOrder}</td>
      <td>
        <button class="btn-small btn-edit" data-action="edit-portfolio" data-id="${p.Id}">Изменить</button>
        <button class="btn-small btn-delete" data-action="delete-portfolio" data-id="${p.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  bindRowActions('portfolio-tbody', 'edit-portfolio', openPortfolioForm);
  bindRowActions('portfolio-tbody', 'delete-portfolio', async (id) => {
    if (!confirm('Удалить работу?')) return;
    await AdminAPI.del(`/admin/portfolio/${id}`);
    loadPortfolio();
  });
}

async function loadAchievements() {
  const tbody = document.getElementById('achievements-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/achievements');

  tbody.innerHTML = items.map(a => `
    <tr>
      <td>${a.Id}</td>
      <td>${a.Year || ''}</td>
      <td>${a.Title}</td>
      <td>${a.SortOrder}</td>
      <td>
        <button class="btn-small btn-edit" data-action="edit-achievement" data-id="${a.Id}">Изменить</button>
        <button class="btn-small btn-delete" data-action="delete-achievement" data-id="${a.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  bindRowActions('achievements-tbody', 'edit-achievement', openAchievementForm);
  bindRowActions('achievements-tbody', 'delete-achievement', async (id) => {
    if (!confirm('Удалить достижение?')) return;
    await AdminAPI.del(`/admin/achievements/${id}`);
    loadAchievements();
  });
}

async function loadContacts() {
  const tbody = document.getElementById('contacts-tbody');
  if (!tbody) return;
  const items = await AdminAPI.get('/admin/contacts');

  tbody.innerHTML = items.map(c => `
    <tr>
      <td>${c.Id}</td>
      <td>${c.Name}</td>
      <td>${c.Contact}</td>
      <td>${(c.Message || '').substring(0, 60)}…</td>
      <td>${c.IsRead ? 'Да' : 'Нет'}</td>
      <td>
        <button class="btn-small btn-edit" data-action="read-contact" data-id="${c.Id}" data-read="${c.IsRead ? 1 : 0}">
          ${c.IsRead ? 'Не прочитано' : 'Прочитано'}
        </button>
        <button class="btn-small btn-delete" data-action="delete-contact" data-id="${c.Id}">Удалить</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Пусто</td></tr>`;

  tbody.querySelectorAll('button[data-action="read-contact"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newVal = btn.dataset.read === '1' ? 0 : 1;
      await AdminAPI.put(`/admin/contacts/${btn.dataset.id}/read`, { IsRead: newVal });
      loadContacts();
    });
  });

  bindRowActions('contacts-tbody', 'delete-contact', async (id) => {
    if (!confirm('Удалить сообщение?')) return;
    await AdminAPI.del(`/admin/contacts/${id}`);
    loadContacts();
  });
}

function bindRowActions(tbodyId, action, handler) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.querySelectorAll(`button[data-action="${action}"]`).forEach(btn => {
    btn.addEventListener('click', () => handler(Number(btn.dataset.id)));
  });
}

function catName(id) {
  const c = categoriesCache.find(x => x.Id === id);
  return c ? c.Name : '—';
}

/* ===== Модалка ===== */
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

/* ===== Формы ===== */
async function openServiceForm(id = null) {
  const isEdit = !!id;
  let s = {};
  if (isEdit) {
    const all = await AdminAPI.get('/admin/services');
    s = all.find(x => x.Id === id) || {};
  }

  const catOptions = categoriesCache.map(c =>
    `<option value="${c.Id}" ${s.CategoryId === c.Id ? 'selected' : ''}>${c.Name}</option>`).join('');

  const html = `
    <label class="form-field"><span>Название *</span><input type="text" id="f-title" value="${s.Title || ''}" required></label>
    <label class="form-field"><span>Описание</span><textarea id="f-desc" rows="3">${s.Description || ''}</textarea></label>
    <div class="form-row-2">
      <label class="form-field"><span>Цена</span><input type="number" id="f-price" value="${s.Price || 0}"></label>
      <label class="form-field"><span>Единица</span><input type="text" id="f-unit" value="${s.PriceUnit || 'рублей'}"></label>
    </div>
    <label class="form-field"><span>Картинка</span><input type="text" id="f-image" value="${s.ImageUrl || ''}"></label>
    <label class="form-field"><span>Категория</span><select id="f-cat"><option value="">— Нет —</option>${catOptions}</select></label>
    <div class="form-row-2">
      <label class="form-checkbox"><input type="checkbox" id="f-pop" ${s.IsPopular ? 'checked' : ''}><span>Популярная</span></label>
      <label class="form-checkbox"><input type="checkbox" id="f-active" ${s.IsActive !== 0 ? 'checked' : ''}><span>Активна</span></label>
    </div>
    <label class="form-field"><span>Порядок</span><input type="number" id="f-sort" value="${s.SortOrder || 0}"></label>
  `;

  openModal(isEdit ? 'Изменить услугу' : 'Добавить услугу', html, async () => {
    const data = {
      Title: document.getElementById('f-title').value.trim(),
      Description: document.getElementById('f-desc').value.trim(),
      Price: Number(document.getElementById('f-price').value) || 0,
      PriceUnit: document.getElementById('f-unit').value.trim(),
      ImageUrl: document.getElementById('f-image').value.trim(),
      CategoryId: Number(document.getElementById('f-cat').value) || null,
      IsPopular: document.getElementById('f-pop').checked,
      IsActive: document.getElementById('f-active').checked,
      SortOrder: Number(document.getElementById('f-sort').value) || 0
    };
    if (isEdit) await AdminAPI.put(`/admin/services/${id}`, data);
    else await AdminAPI.post('/admin/services', data);
    closeModal();
    loadServices();
  });
}

async function removeService(id) {
  if (!confirm('Удалить услугу?')) return;
  await AdminAPI.del(`/admin/services/${id}`);
  loadServices();
}

async function openPromocodeForm(id = null) {
  const isEdit = !!id;
  let p = {};
  if (isEdit) {
    const all = await AdminAPI.get('/admin/promocodes');
    p = all.find(x => x.Id === id) || {};
  }

  const html = `
    <label class="form-field"><span>Код *</span><input type="text" id="f-code" value="${p.Code || ''}" required></label>
    <div class="form-row-2">
      <label class="form-field"><span>Скидка %</span><input type="number" id="f-percent" value="${p.DiscountPercent || ''}"></label>
      <label class="form-field"><span>Скидка ₽</span><input type="number" id="f-amount" value="${p.DiscountAmount || ''}"></label>
    </div>
    <label class="form-field"><span>Лимит</span><input type="number" id="f-limit" value="${p.UsageLimit || ''}"></label>
    <label class="form-checkbox"><input type="checkbox" id="f-active" ${p.IsActive !== 0 ? 'checked' : ''}><span>Активен</span></label>
  `;

  openModal(isEdit ? 'Изменить промокод' : 'Добавить промокод', html, async () => {
    const data = {
      Code: document.getElementById('f-code').value.trim(),
      DiscountPercent: Number(document.getElementById('f-percent').value) || null,
      DiscountAmount: Number(document.getElementById('f-amount').value) || null,
      UsageLimit: Number(document.getElementById('f-limit').value) || null,
      IsActive: document.getElementById('f-active').checked
    };
    if (isEdit) await AdminAPI.put(`/admin/promocodes/${id}`, data);
    else await AdminAPI.post('/admin/promocodes', data);
    closeModal();
    loadPromocodes();
  });
}

async function removePromocode(id) {
  if (!confirm('Удалить промокод?')) return;
  await AdminAPI.del(`/admin/promocodes/${id}`);
  loadPromocodes();
}

async function openPortfolioForm(id = null) {
  const isEdit = !!id;
  let p = {};
  if (isEdit) {
    const all = await AdminAPI.get('/admin/portfolio');
    p = all.find(x => x.Id === id) || {};
  }

  const catOptions = categoriesCache.map(c =>
    `<option value="${c.Id}" ${p.CategoryId === c.Id ? 'selected' : ''}>${c.Name}</option>`).join('');

  const html = `
    <label class="form-field"><span>Название</span><input type="text" id="f-title" value="${p.Title || ''}"></label>
    <label class="form-field"><span>Картинка *</span><input type="text" id="f-image" value="${p.ImageUrl || ''}" required></label>
    <label class="form-field"><span>Категория</span><select id="f-cat"><option value="">— Нет —</option>${catOptions}</select></label>
    <label class="form-field"><span>Порядок</span><input type="number" id="f-sort" value="${p.SortOrder || 0}"></label>
  `;

  openModal(isEdit ? 'Изменить работу' : 'Добавить работу', html, async () => {
    const data = {
      Title: document.getElementById('f-title').value.trim(),
      ImageUrl: document.getElementById('f-image').value.trim(),
      CategoryId: Number(document.getElementById('f-cat').value) || null,
      SortOrder: Number(document.getElementById('f-sort').value) || 0
    };
    if (isEdit) await AdminAPI.put(`/admin/portfolio/${id}`, data);
    else await AdminAPI.post('/admin/portfolio', data);
    closeModal();
    loadPortfolio();
  });
}

async function openAchievementForm(id = null) {
  const isEdit = !!id;
  let a = {};
  if (isEdit) {
    const all = await AdminAPI.get('/admin/achievements');
    a = all.find(x => x.Id === id) || {};
  }

  const html = `
    <label class="form-field"><span>Заголовок *</span><input type="text" id="f-title" value="${a.Title || ''}" required></label>
    <label class="form-field"><span>Описание</span><textarea id="f-desc" rows="3">${a.Description || ''}</textarea></label>
    <div class="form-row-2">
      <label class="form-field"><span>Год</span><input type="number" id="f-year" value="${a.Year || ''}"></label>
      <label class="form-field"><span>Порядок</span><input type="number" id="f-sort" value="${a.SortOrder || 0}"></label>
    </div>
  `;

  openModal(isEdit ? 'Изменить достижение' : 'Добавить достижение', html, async () => {
    const data = {
      Title: document.getElementById('f-title').value.trim(),
      Description: document.getElementById('f-desc').value.trim(),
      Year: Number(document.getElementById('f-year').value) || null,
      SortOrder: Number(document.getElementById('f-sort').value) || 0
    };
    if (isEdit) await AdminAPI.put(`/admin/achievements/${id}`, data);
    else await AdminAPI.post('/admin/achievements', data);
    closeModal();
    loadAchievements();
  });
}

/* ===== Проверка авторизации ===== */
async function checkAuth() {
  const token = localStorage.getItem('nvphotos_admin_token');
  const login = localStorage.getItem('nvphotos_admin_login');

  if (!token) {
    window.location.href = 'login.html';
    return false;
  }

  try {
    const res = await fetch(`${ADMIN_API}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      localStorage.removeItem('nvphotos_admin_token');
      window.location.href = 'login.html';
      return false;
    }
    document.getElementById('admin-name').textContent = login || 'admin';
    return true;
  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
    return false;
  }
}

/* ===== Инициализация ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const ok = await checkAuth();
  if (!ok) return;

  try {
    categoriesCache = await AdminAPI.get('/categories');
  } catch (e) {
    categoriesCache = [];
  }

  // Делегирование кликов по вкладкам — работает надёжно
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const tab = e.target.closest('.admin-tab');
      if (!tab) return;
      e.preventDefault();
      switchTab(tab.dataset.tab);
    });
  }

  // Кнопки "Добавить"
  document.querySelectorAll('[data-action="add-service"]').forEach(b =>
    b.addEventListener('click', () => openServiceForm()));
  document.querySelectorAll('[data-action="add-promocode"]').forEach(b =>
    b.addEventListener('click', () => openPromocodeForm()));
  document.querySelectorAll('[data-action="add-portfolio"]').forEach(b =>
    b.addEventListener('click', () => openPortfolioForm()));
  document.querySelectorAll('[data-action="add-achievement"]').forEach(b =>
    b.addEventListener('click', () => openAchievementForm()));

  // Модалка
  const closeBtn = document.getElementById('admin-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'admin-modal') closeModal();
    });
  }

  // Выход
  const logout = document.getElementById('logout-link');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('nvphotos_admin_token');
      localStorage.removeItem('nvphotos_admin_login');
      window.location.href = 'login.html';
    });
  }

  // Первая загрузка
  await loadServices();
});