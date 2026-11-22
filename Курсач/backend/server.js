const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { poolPromise } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

/* ===== НАСТРОЙКА MULTER (ЗАГРУЗКА ФАЙЛОВ) ===== */
const UPLOAD_DIR = path.join(__dirname, '..', 'frontend', 'img', 'portfolio');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Разрешены только jpg, png, webp, gif'));
  }
});

/* ===== СТАТИКА ===== */
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/img/portfolio', express.static(UPLOAD_DIR));

/* ===== MIDDLEWARE АВТОРИЗАЦИИ ===== */
async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ success: false, error: 'Требуется авторизация' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Token', token)
      .query('SELECT Id, Login FROM Admins WHERE Token = @Token');

    if (result.recordset.length === 0) return res.status(401).json({ success: false, error: 'Неверный токен' });
    req.admin = result.recordset[0];
    next();
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

/* ===== HEALTH ===== */
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: result.recordset[0].ok === 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ===== AUTH ===== */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ success: false, error: 'Введите логин и пароль' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Login', login).input('Password', password)
      .query('SELECT Id, Login FROM Admins WHERE Login = @Login AND PasswordHash = @Password');
    if (result.recordset.length === 0) return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    
    const admin = result.recordset[0];
    const token = 'adm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
    await pool.request().input('Id', admin.Id).input('Token', token).query('UPDATE Admins SET Token = @Token WHERE Id = @Id');
    res.json({ success: true, token, login: admin.Login });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ success: false });
    const pool = await poolPromise;
    const result = await pool.request().input('Token', token).query('SELECT Id, Login FROM Admins WHERE Token = @Token');
    if (result.recordset.length === 0) return res.status(401).json({ success: false });
    res.json({ success: true, admin: result.recordset[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== UPLOAD (МНОЖЕСТВЕННАЯ ЗАГРУЗКА) ===== */
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.array('files', 50)(req, res, function (err) {
    // Ловим ошибку multer
    if (err) {
      console.error('❌ ОШИБКА MULTER:', err);
      return res.status(500).json({ success: false, error: 'Multer: ' + err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Файлы не получены' });
    }
    
    console.log('✅ Файлы успешно загружены:', req.files.length);
    const urls = req.files.map(file => '/img/portfolio/' + file.filename);
    res.json({ success: true, urls });
  });
});

/* ===== SERVICES ===== */
app.get('/api/services', async (req, res) => {
  try {
    const pool = await poolPromise;
    const popularOnly = req.query.popular === 'true';
    const query = popularOnly
      ? 'SELECT * FROM Services WHERE IsActive = 1 AND IsPopular = 1 ORDER BY SortOrder'
      : 'SELECT * FROM Services WHERE IsActive = 1 ORDER BY SortOrder';
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/services', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Services ORDER BY SortOrder');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/services', requireAdmin, async (req, res) => {
  try {
    const { Title, Description, Price, PriceUnit, ImageUrl, CategoryId, IsPopular, IsActive, SortOrder } = req.body;
    if (!Title || !Title.trim()) return res.status(400).json({ success: false, error: 'Название обязательно' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Title', Title.trim()).input('Description', Description || '')
      .input('Price', Price || 0).input('PriceUnit', PriceUnit || 'рублей')
      .input('ImageUrl', ImageUrl || '').input('CategoryId', CategoryId || null)
      .input('IsPopular', IsPopular ? 1 : 0).input('IsActive', IsActive ? 1 : 0)
      .input('SortOrder', SortOrder || 0)
      .query(`INSERT INTO Services (Title, Description, Price, PriceUnit, ImageUrl, CategoryId, IsPopular, IsActive, SortOrder)
              OUTPUT INSERTED.Id VALUES (@Title,@Description,@Price,@PriceUnit,@ImageUrl,@CategoryId,@IsPopular,@IsActive,@SortOrder)`);
    res.json({ success: true, id: result.recordset[0].Id });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/services/:id', requireAdmin, async (req, res) => {
  try {
    const { Title, Description, Price, PriceUnit, ImageUrl, CategoryId, IsPopular, IsActive, SortOrder } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', req.params.id).input('Title', Title.trim())
      .input('Description', Description || '').input('Price', Price || 0)
      .input('PriceUnit', PriceUnit || 'рублей').input('ImageUrl', ImageUrl || '')
      .input('CategoryId', CategoryId || null).input('IsPopular', IsPopular ? 1 : 0)
      .input('IsActive', IsActive ? 1 : 0).input('SortOrder', SortOrder || 0)
      .query(`UPDATE Services SET Title=@Title,Description=@Description,Price=@Price,PriceUnit=@PriceUnit,
              ImageUrl=@ImageUrl,CategoryId=@CategoryId,IsPopular=@IsPopular,IsActive=@IsActive,SortOrder=@SortOrder WHERE Id=@Id`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/services/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Services WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== CATEGORIES ===== */
app.get('/api/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Categories ORDER BY Name');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ===== ACHIEVEMENTS ===== */
app.get('/api/achievements', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Achievements ORDER BY SortOrder');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/achievements', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Achievements ORDER BY SortOrder');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/achievements', requireAdmin, async (req, res) => {
  try {
    const { Title, Description, Year, SortOrder } = req.body;
    if (!Title || !Title.trim()) return res.status(400).json({ success: false, error: 'Заголовок обязателен' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Title', Title.trim()).input('Description', Description || '')
      .input('Year', Year || null).input('SortOrder', SortOrder || 0)
      .query(`INSERT INTO Achievements (Title, Description, Year, SortOrder)
              OUTPUT INSERTED.Id VALUES (@Title,@Description,@Year,@SortOrder)`);
    res.json({ success: true, id: result.recordset[0].Id });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/achievements/:id', requireAdmin, async (req, res) => {
  try {
    const { Title, Description, Year, SortOrder } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', req.params.id).input('Title', Title.trim())
      .input('Description', Description || '').input('Year', Year || null)
      .input('SortOrder', SortOrder || 0)
      .query(`UPDATE Achievements SET Title=@Title,Description=@Description,Year=@Year,SortOrder=@SortOrder WHERE Id=@Id`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/achievements/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Achievements WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== PORTFOLIO ===== */
app.get('/api/portfolio', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { category } = req.query;

    if (category) {
      const result = await pool.request().input('Slug', category)
        .query(`SELECT p.* FROM Portfolio p JOIN Categories c ON c.Id=p.CategoryId
                WHERE c.Slug=@Slug ORDER BY p.SortOrder`);
      return res.json(result.recordset);
    }

    const result = await pool.request().query('SELECT * FROM Portfolio ORDER BY SortOrder');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/portfolio/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT DISTINCT c.Id, c.Name, c.Slug FROM Categories c
      JOIN Portfolio p ON p.CategoryId=c.Id ORDER BY c.Name`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/portfolio', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Portfolio ORDER BY SortOrder');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/portfolio', requireAdmin, async (req, res) => {
  try {
    const { Title, ImageUrl, CategoryId, SortOrder } = req.body;
    if (!ImageUrl || !ImageUrl.trim()) return res.status(400).json({ success: false, error: 'Картинка обязательна' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Title', Title || '').input('ImageUrl', ImageUrl.trim())
      .input('CategoryId', CategoryId || null).input('SortOrder', SortOrder || 0)
      .query(`INSERT INTO Portfolio (Title, ImageUrl, CategoryId, SortOrder)
              OUTPUT INSERTED.Id VALUES (@Title,@ImageUrl,@CategoryId,@SortOrder)`);
    res.json({ success: true, id: result.recordset[0].Id });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const { Title, ImageUrl, CategoryId, SortOrder } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', req.params.id).input('Title', Title || '')
      .input('ImageUrl', ImageUrl).input('CategoryId', CategoryId || null)
      .input('SortOrder', SortOrder || 0)
      .query(`UPDATE Portfolio SET Title=@Title,ImageUrl=@ImageUrl,CategoryId=@CategoryId,SortOrder=@SortOrder WHERE Id=@Id`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Portfolio WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== REVIEWS ===== */
app.get('/api/reviews', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 10 * FROM Reviews WHERE IsPublished=1 ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Reviews WHERE IsPublished=1 ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { authorName, reviewText, rating } = req.body;
    if (!authorName || authorName.trim().length < 2) return res.status(400).json({ success: false, error: 'Введите имя' });
    if (!reviewText || reviewText.trim().length < 5) return res.status(400).json({ success: false, error: 'Введите текст отзыва (минимум 5 символов)' });
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ success: false, error: 'Оценка должна быть от 1 до 5' });

    const pool = await poolPromise;
    await pool.request()
      .input('AuthorName', authorName.trim()).input('ReviewText', reviewText.trim()).input('Rating', r)
      .query(`INSERT INTO Reviews (AuthorName, ReviewText, Rating, IsPublished) VALUES (@AuthorName, @ReviewText, @Rating, 0)`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Reviews ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/reviews/:id/publish', requireAdmin, async (req, res) => {
  try {
    const { IsPublished } = req.body;
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).input('IsPublished', IsPublished ? 1 : 0)
      .query('UPDATE Reviews SET IsPublished=@IsPublished WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Reviews WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== PROMOCODES ===== */
app.post('/api/promocodes/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false });
    const pool = await poolPromise;
    const result = await pool.request().input('Code', code.toUpperCase())
      .query(`SELECT * FROM Promocodes WHERE Code=@Code AND IsActive=1
              AND (ExpiresAt IS NULL OR ExpiresAt>GETDATE())
              AND (UsageLimit IS NULL OR UsedCount<UsageLimit)`);
    if (result.recordset.length === 0) return res.json({ valid: false });
    const promo = result.recordset[0];
    res.json({ valid: true, discountPercent: promo.DiscountPercent, discountAmount: promo.DiscountAmount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/promocodes', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Promocodes ORDER BY Id DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/promocodes', requireAdmin, async (req, res) => {
  try {
    const { Code, DiscountPercent, DiscountAmount, ExpiresAt, UsageLimit, IsActive } = req.body;
    if (!Code || !Code.trim()) return res.status(400).json({ success: false, error: 'Код обязателен' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Code', Code.toUpperCase().trim()).input('DiscountPercent', DiscountPercent || null)
      .input('DiscountAmount', DiscountAmount || null).input('ExpiresAt', ExpiresAt || null)
      .input('UsageLimit', UsageLimit || null).input('IsActive', IsActive ? 1 : 0)
      .query(`INSERT INTO Promocodes (Code,DiscountPercent,DiscountAmount,ExpiresAt,UsageLimit,IsActive)
              OUTPUT INSERTED.Id VALUES (@Code,@DiscountPercent,@DiscountAmount,@ExpiresAt,@UsageLimit,@IsActive)`);
    res.json({ success: true, id: result.recordset[0].Id });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/promocodes/:id', requireAdmin, async (req, res) => {
  try {
    const { Code, DiscountPercent, DiscountAmount, ExpiresAt, UsageLimit, IsActive } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', req.params.id).input('Code', Code.toUpperCase().trim())
      .input('DiscountPercent', DiscountPercent || null).input('DiscountAmount', DiscountAmount || null)
      .input('ExpiresAt', ExpiresAt || null).input('UsageLimit', UsageLimit || null)
      .input('IsActive', IsActive ? 1 : 0)
      .query(`UPDATE Promocodes SET Code=@Code,DiscountPercent=@DiscountPercent,DiscountAmount=@DiscountAmount,
              ExpiresAt=@ExpiresAt,UsageLimit=@UsageLimit,IsActive=@IsActive WHERE Id=@Id`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/promocodes/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Promocodes WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== ORDERS ===== */
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, shootTime, comment, items, total, promocode } = req.body;
    const pool = await poolPromise;

    let promocodeId = null;
    if (promocode) {
      const p = await pool.request().input('Code', promocode).query('SELECT Id FROM Promocodes WHERE Code=@Code');
      if (p.recordset.length > 0) promocodeId = p.recordset[0].Id;
    }

    const orderRes = await pool.request()
      .input('CustomerName', customerName).input('Phone', phone)
      .input('ShootTime', shootTime).input('Comment', comment || null)
      .input('Total', total).input('PromocodeId', promocodeId)
      .query(`INSERT INTO Orders (CustomerName,Phone,ShootTime,Comment,Total,PromocodeId)
              OUTPUT INSERTED.Id VALUES (@CustomerName,@Phone,@ShootTime,@Comment,@Total,@PromocodeId)`);

    const orderId = orderRes.recordset[0].Id;

    for (const item of items) {
      await pool.request()
        .input('OrderId', orderId).input('ServiceId', item.id)
        .input('Quantity', item.quantity).input('Price', item.price)
        .query(`INSERT INTO OrderItems (OrderId,ServiceId,Quantity,Price) VALUES (@OrderId,@ServiceId,@Quantity,@Price)`);
    }

    if (promocodeId) {
      await pool.request().input('Id', promocodeId)
        .query('UPDATE Promocodes SET UsedCount = UsedCount + 1 WHERE Id = @Id');
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT o.*, (SELECT COUNT(*) FROM OrderItems oi WHERE oi.OrderId=o.Id) AS ItemsCount
      FROM Orders o ORDER BY o.CreatedAt DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).input('Status', status)
      .query('UPDATE Orders SET Status=@Status WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

/* ===== CONTACTS ===== */
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, contact, message } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ success: false, error: 'Имя слишком короткое' });
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^[\+]?[\d\s\-\(\)]{7,}$/;
    if (!contact || (!emailRe.test(contact.trim()) && !phoneRe.test(contact.trim()))) {
      return res.status(400).json({ success: false, error: 'Некорректный email или телефон' });
    }
    if (!message || message.trim().length < 5) return res.status(400).json({ success: false, error: 'Сообщение слишком короткое' });

    const pool = await poolPromise;
    await pool.request().input('Name', name.trim()).input('Contact', contact.trim()).input('Message', message.trim())
      .query(`INSERT INTO Contacts (Name,Contact,Message) VALUES (@Name,@Contact,@Message)`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/contacts', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Contacts ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/contacts/:id/read', requireAdmin, async (req, res) => {
  try {
    const { IsRead } = req.body;
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).input('IsRead', IsRead ? 1 : 0)
      .query('UPDATE Contacts SET IsRead=@IsRead WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', req.params.id).query('DELETE FROM Contacts WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});