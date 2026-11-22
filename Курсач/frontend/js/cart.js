const Cart = {
  items: [],
  discountPercent: 0,
  appliedPromo: null,

  init() {
    this.load();
    this.render();
    this.bindEvents();
  },

  load() {
    const saved = localStorage.getItem('nvphotos_cart');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.items = data.items || [];
        this.discountPercent = data.discountPercent || 0;
        this.appliedPromo = data.appliedPromo || null;
      } catch (e) {
        this.items = [];
      }
    }
  },

  save() {
    localStorage.setItem('nvphotos_cart', JSON.stringify({
      items: this.items,
      discountPercent: this.discountPercent,
      appliedPromo: this.appliedPromo
    }));
  },

  add(id, title, price) {
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ id, title, price, quantity: 1 });
    }
    this.save();
    this.render();
  },

  remove(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    if (!confirm(`Удалить «${item.title}» из корзины?`)) return;

    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
  },

  clear() {
    this.items = [];
    this.discountPercent = 0;
    this.appliedPromo = null;
    this.save();
    this.render();
  },

  subtotal() {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  },

  total() {
    const subtotal = this.subtotal();
    return Math.round(subtotal * (1 - this.discountPercent / 100));
  },

  count() {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  },

  async applyPromo(code) {
    const result = await API.validatePromocode(code);

    if (result.valid) {
      this.discountPercent = result.discountPercent;
      this.appliedPromo = code.toUpperCase();
      this.save();
      this.render();
      return { success: true, discount: result.discountPercent };
    } else {
      this.discountPercent = 0;
      this.appliedPromo = null;
      this.save();
      this.render();
      return { success: false };
    }
  },

  render() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = this.count();

    const itemsEl = document.getElementById('cart-items');
    if (!itemsEl) return;

    if (this.items.length === 0) {
      itemsEl.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
    } else {
      itemsEl.innerHTML = this.items.map(i => `
        <div class="cart-item">
          <div class="cart-item-info">
            <span class="cart-item-title">${i.title}</span>
            <span class="cart-item-qty">× ${i.quantity}</span>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${i.price * i.quantity} ₽</span>
            <button class="cart-item-remove" data-id="${i.id}" title="Удалить">×</button>
          </div>
        </div>
      `).join('');

      itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => this.remove(Number(btn.dataset.id)));
      });
    }

    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = this.subtotal() + ' ₽';
    if (discountEl) {
      if (this.discountPercent > 0) {
        discountEl.textContent = `−${this.discountPercent}%`;
        discountEl.parentElement.style.display = 'flex';
      } else {
        discountEl.parentElement.style.display = 'none';
      }
    }
    if (totalEl) totalEl.textContent = this.total() + ' ₽';

    const promoInput = document.getElementById('promo-input');
    if (promoInput && this.appliedPromo) {
      promoInput.value = this.appliedPromo;
    }
  },

  bindEvents() {
    const promoBtn = document.getElementById('promo-apply');
    const promoInput = document.getElementById('promo-input');
    const promoMsg = document.getElementById('promo-message');

    if (promoBtn) {
      promoBtn.addEventListener('click', async () => {
        const code = promoInput.value.trim();
        if (!code) {
          promoMsg.style.color = '#c00';
          promoMsg.textContent = 'Введите промокод';
          return;
        }

        const result = await this.applyPromo(code);

        if (result.success) {
          promoMsg.style.color = '#2a7';
          promoMsg.textContent = `Промокод применён: скидка ${result.discount}%`;
        } else {
          promoMsg.style.color = '#c00';
          promoMsg.textContent = 'Промокод недействителен';
        }
      });
    }

    const modal = document.getElementById('cart-modal');
    const cartLink = document.getElementById('cart-link');
    const cartClose = document.getElementById('cart-close');

    if (cartLink && modal) {
      cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
        this.render();
      });
    }

    if (cartClose && modal) {
      cartClose.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  }
};