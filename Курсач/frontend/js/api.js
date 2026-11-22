const API_BASE = 'http://localhost:3000/api';

const API = {

  async getServices() {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Ошибка загрузки услуг');
    return res.json();
  },

  async getPopularServices() {
    const res = await fetch(`${API_BASE}/services?popular=true`);
    if (!res.ok) throw new Error('Ошибка загрузки популярных услуг');
    return res.json();
  },

  async getReviews() {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error('Ошибка загрузки отзывов');
    return res.json();
  },

  async getPortfolio() {
    const res = await fetch(`${API_BASE}/portfolio`);
    if (!res.ok) throw new Error('Ошибка загрузки портфолио');
    return res.json();
  },

  async getPortfolioCategories() {
    const res = await fetch(`${API_BASE}/portfolio/categories`);
    if (!res.ok) throw new Error('Ошибка загрузки категорий');
    return res.json();
  },

  async getPortfolioByCategory(slug) {
    const res = await fetch(`${API_BASE}/portfolio?category=${slug}`);
    if (!res.ok) throw new Error('Ошибка загрузки работ');
    return res.json();
  },

  async getAchievements() {
    const res = await fetch(`${API_BASE}/achievements`);
    if (!res.ok) throw new Error('Ошибка загрузки достижений');
    return res.json();
  },

  async validatePromocode(code) {
    const res = await fetch(`${API_BASE}/promocodes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return res.json();
  },
    async getAllReviews() {
    const res = await fetch(`${API_BASE}/reviews/all`);
    if (!res.ok) throw new Error('Ошибка загрузки отзывов');
    return res.json();
  },

  async createReview(data) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async createOrder(order) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.json();
  }
};