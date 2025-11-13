# Инструкция по запуску HH Auto-Responder

## Что уже сделано

✅ Backend API с OAuth авторизацией HH.ru
✅ Prisma ORM + SQLite база данных
✅ Автоматическая рассылка откликов (cron job)
✅ Frontend React приложение с современным дизайном
✅ Все зависимости установлены
✅ База данных создана и мигрирована

## Быстрый старт

### 1. Запустить Backend

```bash
cd backend
npm run dev
```

Backend запустится на **http://localhost:8080**

### 2. Запустить Frontend (в отдельном терминале)

```bash
cd frontend
npm run dev
```

Frontend запустится на **http://localhost:5173**

### 3. Или запустить ОБА СЕРВЕРА одновременно (из корня)

```bash
npm run dev
```

## Вход в приложение

1. Откройте **http://localhost:5173**
2. Нажмите "Войти через HH.ru"
3. Авторизуйтесь на HH.ru
4. Вы будете перенаправлены в Dashboard

## API Endpoints

### Авторизация
- `GET /auth/hh` - Редирект на HH.ru для авторизации
- `GET /callback` - OAuth callback
- `GET /auth/me` - Получить информацию о пользователе

### Резюме
- `GET /api/resumes` - Получить все резюме
- `GET /api/resumes/:id` - Получить конкретное резюме

### Вакансии
- `GET /api/vacancies/search` - Поиск вакансий
- `GET /api/vacancies/:id` - Детальная информация

### Отклики
- `POST /api/applications` - Отправить отклик
- `GET /api/applications` - Получить все отклики
- `GET /api/applications/:id` - Детали отклика

### Настройки
- `GET /api/settings` - Получить настройки
- `PUT /api/settings` - Обновить настройки

### Аналитика
- `GET /api/analytics` - Получить аналитику
- `GET /api/analytics/today` - Статистика за сегодня

## Структура проекта

```
hhby/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # HH API сервис
│   │   ├── jobs/     # Cron jobs
│   │   └── index.ts  # Главный файл
│   └── prisma/
│       └── schema.prisma
├── frontend/         # React + Vite
│   └── src/
│       ├── pages/    # Страницы
│       ├── components/ # Компоненты
│       ├── api/      # API клиент
│       └── store/    # Zustand state
└── README.md
```

## Автоматическая рассылка

Cron job запускается:
- **Production**: каждый час
- **Development**: каждые 5 минут

Для включения автоматической рассылки:
1. Зайдите в **Настройки**
2. Включите тумблер "Автоматические отклики"
3. Настройте фильтры поиска
4. Укажите максимум откликов в день
5. Сохраните настройки

## Переменные окружения

### Backend (.env)
```
PORT=8080
DATABASE_URL="file:./dev.db"
HH_CLIENT_ID=ваш_client_id
HH_CLIENT_SECRET=ваш_client_secret
HH_REDIRECT_URI=http://localhost:8080/callback
JWT_SECRET=ваш_jwt_secret
ENCRYPTION_KEY=ваш_encryption_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
```

## Дополнительные команды

### Prisma
```bash
cd backend

# Открыть Prisma Studio (GUI для БД)
npx prisma studio

# Применить изменения схемы
npx prisma migrate dev

# Сгенерировать клиент
npx prisma generate
```

### Build для Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Что дальше?

Проект полностью готов к использованию! Вы можете:

1. ✅ Авторизоваться через HH.ru
2. ✅ Искать вакансии с фильтрами
3. ✅ Отправлять отклики вручную
4. ✅ Настроить автоматическую рассылку
5. ✅ Отслеживать статистику

### Возможные улучшения (по желанию):

- AI генерация сопроводительных писем (интеграция с OpenAI)
- Telegram бот для уведомлений
- Более продвинутая аналитика (графики, Charts.js)
- Экспорт данных в CSV/Excel
- Multi-аккаунты
- Темная/светлая тема
