document.addEventListener('DOMContentLoaded', () => {

    Cart.init();
    loadReviews();
  
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        Cart.add(
          Number(btn.dataset.id),
          btn.dataset.title,
          Number(btn.dataset.price)
        );
        btn.textContent = 'Добавлено ✓';
        setTimeout(() => btn.textContent = 'В корзину', 1000);
      });
    });
  
    const cartModal = document.getElementById('cart-modal');
    const cartLink = document.getElementById('cart-link');
    const cartClose = document.getElementById('cart-close');
  
    cartLink.addEventListener('click', (e) => {
      e.preventDefault();
      cartModal.classList.add('open');
    });
  
    cartClose.addEventListener('click', () => {
      cartModal.classList.remove('open');
    });
  
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) cartModal.classList.remove('open');
    });
  
    const promoBtn = document.getElementById('promo-apply');
    const promoInput = document.getElementById('promo-input');
    const promoMsg = document.getElementById('promo-message');
  
    promoBtn.addEventListener('click', async () => {
      const code = promoInput.value.trim();
      if (!code) return;
  
      const result = await API.validatePromocode(code);
  
      if (result.valid) {
        Cart.discountPercent = result.discountPercent;
        promoMsg.style.color = '#2a7';
        promoMsg.textContent = `Промокод применён: скидка ${result.discountPercent}%`;
        Cart.render();
      } else {
        Cart.discountPercent = 0;
        promoMsg.style.color = '#c00';
        promoMsg.textContent = 'Промокод недействителен';
        Cart.render();
      }
    });
  
    document.getElementById('checkout-btn').addEventListener('click', async () => {
      if (Cart.items.length === 0) {
        alert('Корзина пуста');
        return;
      }
  
      const name = prompt('Введите имя:');
      if (!name) return;
  
      const phone = prompt('Введите номер телефона:');
      if (!phone) return;
  
      const time = prompt('Желаемое время съёмки (например, 15.05.2025 14:00):');
      if (!time) return;
  
      const order = {
        customerName: name,
        phone: phone,
        shootTime: time,
        items: Cart.items,
        total: Cart.total(),
        discount: Cart.discountPercent
      };
  
      const result = await API.createOrder(order);
  
      if (result.success) {
        alert(`Заказ №${result.orderId} оформлен. Фотограф свяжется с вами.`);
        Cart.items = [];
        Cart.discountPercent = 0;
        Cart.save();
        Cart.render();
        cartModal.classList.remove('open');
      } else {
        alert('Ошибка при оформлении заказа');
      }
    });
  });