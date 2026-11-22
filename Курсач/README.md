# NVPhotos — сайт-визитка фотографа

Автоматизированная информационная система в виде сайта-визитки частного фотографа с каталогом услуг, портфолио, отзывами, корзиной и админ-панелью.

Стек: HTML, CSS, JavaScript, Node.js, Express, MS SQL Server.

Автор: Надеин Владислав Викторович
Специальность: 09.02.07 «Информационные системы и программирование»
Год: 2026

---

## Возможности

Публичная часть:

- Просмотр услуг, портфолио, достижений и отзывов.
- Поиск услуг по названию.
- Фильтрация портфолио по категориям.
- Корзина с сохранением в localStorage.
- Применение промокодов.
- Оформление заказа с указанием имени, телефона и времени съёмки.
- Форма обратной связи.
- Форма добавления отзыва (с модерацией).

Админ-панель:

- Авторизация по логину и паролю.
- Управление услугами (CRUD + популярность).
- Управление заказами (смена статуса).
- Управление промокодами.
- Модерация отзывов.
- Управление портфолио с загрузкой картинок с компьютера.
- Управление достижениями.
- Просмотр сообщений с формы контактов.

---

## Структура проекта

NVPhotos/
├── backend/                Node.js + Express сервер
│   ├── config/db.js        Подключение к MS SQL Server
│   ├── server.js           Точка входа, все API-эндпоинты
│   ├── .env                Переменные окружения
│   └── package.json
│
├── frontend/               Клиентская часть
│   ├── index.html          Главная
│   ├── services.html       Услуги
│   ├── portfolio.html      Портфолио
│   ├── achievements.html   Достижения
│   ├── reviews.html        Отзывы
│   ├── contacts.html       Контакты
│   ├── login.html          Вход в админку
│   ├── admin.html          Редирект в админ-панель
│   ├── css/                Стили
│   ├── js/                 Скрипты
│   ├── admin/              Страницы админ-панели
│   └── img/                Картинки (в т.ч. img/portfolio/)
│
├── database/               SQL-скрипты
│   ├── schema.sql          Создание таблиц
│   └── seed.sql            Тестовые данные
│
├── docs/                   Документация
│   ├── user-guide.md       Руководство пользователя
│   ├── admin-guide.md      Руководство администратора
│   ├── tech-guide.md       Техническое описание
│   └── tech-spec.md        Техническое задание
│
├── .gitignore
└── README.md

---

## Требования

- Операционная система: Windows 10/11 (или macOS, Linux).
- Node.js: LTS-версия (20.x или выше).
- MS SQL Server Express + SSMS.
- Браузер: Chrome, Firefox, Edge или Safari.

---

## Установка и запуск

### 1. Клонировать проект или распаковать архив

cd NVPhotos

### 2. Установить зависимости бэкенда

cd backend
npm install

### 3. Создать .env в папке backend

DB_USER=sa
DB_PASSWORD=ваш_пароль
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=NVPhotos
PORT=3000

### 4. Запустить сервер

node server.js

Должно вывести:

Сервер запущен: http://localhost:3000
Подключение к MS SQL Server установлено

### 5. Открыть сайт

http://localhost:3000/index.html

Важно: открывать сайт нужно через Express, а не двойным кликом по HTML. Иначе не будут работать API-запросы и картинки портфолио.

---

## Развёртывание базы данных

### 1. Включить TCP/IP в SQL Server

В SQL Server Configuration Manager:

1. SQL Server Network Configuration → Protocols for SQLEXPRESS.
2. Включить TCP/IP.
3. В свойствах TCP/IP → вкладка IP Addresses → раздел IPAll:
   - TCP Dynamic Ports — очистить.
   - TCP Port — 1433.
4. Перезапустить службу SQL Server (SQLEXPRESS).

### 2. Создать базу

В SSMS подключиться и выполнить:

CREATE DATABASE NVPhotos;
GO

Затем выполнить database/schema.sql и database/seed.sql.

### 3. Проверить подключение

netstat -an | findstr 1433

Должна быть строка с LISTENING.

---

## Доступ в админ-панель

URL: http://localhost:3000/login.html
Логин: admin
Пароль: admin123

Пароль можно поменять через SQL:

USE NVPhotos;
UPDATE Admins SET PasswordHash = 'новый_пароль' WHERE Login = 'admin';

---

## Страницы сайта

Главная             /index.html          Hero, услуги, отзывы
Услуги              /services.html       Слайдер популярных, сетка всех, поиск
Портфолио           /portfolio.html      Фильтрация по категориям
Достижения          /achievements.html   Список достижений
Отзывы              /reviews.html        Список + форма добавления
Контакты            /contacts.html       Контакты + форма обратной связи
Вход                /login.html          Вход в админ-панель
Админ-панель        /admin.html          Редирект на admin/services.html

Разделы админ-панели:

/admin/services.html      Услуги
/admin/orders.html        Заказы
/admin/promocodes.html    Промокоды
/admin/reviews.html       Отзывы
/admin/portfolio.html     Портфолио
/admin/achievements.html  Достижения
/admin/contacts.html      Сообщения

---

## API

Базовый URL: http://localhost:3000/api

Публичные эндпоинты:

GET  /health                    Проверка работы сервера и БД
GET  /services                  Все активные услуги
GET  /services?popular=true     Популярные услуги
GET  /categories                Категории
GET  /reviews                   Последние отзывы
GET  /reviews/all               Все опубликованные отзывы
POST /reviews                   Отправить отзыв
GET  /portfolio                 Все работы
GET  /portfolio?category=slug   Работы по категории
GET  /portfolio/categories      Категории портфолио
GET  /achievements              Достижения
POST /promocodes/validate       Проверить промокод
POST /orders                    Создать заказ
POST /contacts                  Отправить сообщение

Административные эндпоинты (требуют заголовок Authorization: Bearer <token>):

POST                    /auth/login                  Вход
GET                     /auth/me                     Проверка токена
POST                    /admin/upload                Загрузить картинку
GET/POST/PUT/DELETE     /admin/services[/:id]        CRUD услуг
GET/PUT                 /admin/orders[/:id/status]   Заказы
GET/POST/PUT/DELETE     /admin/promocodes[/:id]      CRUD промокодов
GET/PUT/DELETE          /admin/reviews[/:id]         Модерация отзывов
GET/POST/PUT/DELETE     /admin/portfolio[/:id]       CRUD портфолио
GET/POST/PUT/DELETE     /admin/achievements[/:id]    CRUD достижений
GET/PUT/DELETE          /admin/contacts[/:id]        Сообщения

---

## Документация

docs/user-guide.md    руководство пользователя
docs/admin-guide.md   руководство администратора
docs/tech-guide.md    техническое описание
docs/tech-spec.md     техническое задание

---

## Лицензия

Проект создан в учебных целях. Свободно используется в рамках курсовой работы.

---

## Контакты

Автор: Надеин Владислав Викторович
Email: example@mail.ru
Telegram: @bank_of_memorie