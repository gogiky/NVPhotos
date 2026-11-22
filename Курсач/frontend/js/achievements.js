async function loadAchievements() {
    const list = document.getElementById('achievements-list');
    if (!list) return;
  
    try {
      const items = await API.getAchievements();
  
      if (items.length === 0) {
        list.innerHTML = '<p style="color:#888;">Пока нет достижений</p>';
        return;
      }
  
      list.innerHTML = items.map(a => `
        <article class="achievement-card">
          <div class="achievement-year">${a.Year || ''}</div>
          <div class="achievement-body">
            <h3>${a.Title}</h3>
            <p>${a.Description || ''}</p>
          </div>
        </article>
      `).join('');
    } catch (err) {
      console.error('Ошибка загрузки достижений:', err);
      list.innerHTML = '<p style="color:#888;">Не удалось загрузить достижения</p>';
    }
  }
  
  document.addEventListener('DOMContentLoaded', loadAchievements);