function openCheckout() {
    if (Cart.items.length === 0) {
      alert('Корзина пуста');
      return;
    }
  
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.classList.remove('open');
  
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.classList.add('open');
  }
  
  function closeCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.classList.remove('open');
  }
  
  async function submitCheckout(e) {
    e.preventDefault();
  
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const time = document.getElementById('checkout-time').value.trim();
    const comment = document.getElementById('checkout-comment').value.trim();
  
    const errorEl = document.getElementById('checkout-error');
    errorEl.textContent = '';
  
    if (name.length < 2) {
      errorEl.textContent = 'Введите имя';
      return;
    }
  
    if (phone.length < 5) {
      errorEl.textContent = 'Введите корректный номер телефона';
      return;
    }
  
    if (!time) {
      errorEl.textContent = 'Укажите желаемое время съёмки';
      return;
    }
  
    const order = {
      customerName: name,
      phone: phone,
      shootTime: time,
      comment: comment,
      items: Cart.items,
      total: Cart.total(),
      discount: Cart.discountPercent,
      promocode: Cart.appliedPromo
    };
  
    const result = await API.createOrder(order);
  
    if (result.success) {
      const successEl = document.getElementById('checkout-success');
      successEl.textContent = `Заказ №${result.orderId} оформлен. Фотограф свяжется с вами по номеру ${phone}.`;
      successEl.style.display = 'block';
  
      Cart.clear();
      document.getElementById('checkout-form').reset();
  
      setTimeout(() => {
        closeCheckout();
        successEl.style.display = 'none';
      }, 4000);
    } else {
      errorEl.textContent = 'Ошибка при оформлении заказа. Попробуйте позже.';
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeBtn = document.getElementById('checkout-close');
    const form = document.getElementById('checkout-form');
  
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
    if (closeBtn) closeBtn.addEventListener('click', closeCheckout);
    if (form) form.addEventListener('submit', submitCheckout);
  
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
      checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) closeCheckout();
      });
    }
  });