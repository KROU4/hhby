# HH.ru Auto-Responder

Автоматический сервис для рассылки откликов на вакансии HH.ru

## Технологический стек

### Backend
- Node.js + Express + TypeScript
- PostgreSQL / SQLite
- Prisma ORM
- OAuth 2.0 (HH.ru API)

### Frontend
- React + Vite + TypeScript
- TailwindCSS
- Framer Motion
- Unbounded font

## Установка

```bash
npm install
npm run install:all
```

## Запуск

```bash
# Запуск в dev режиме (backend + frontend одновременно)
npm run dev

# Запуск только backend
npm run dev:backend

# Запуск только frontend
npm run dev:frontend
```

## Структура проекта

```
hhby/
├── backend/          # Backend API
├── frontend/         # React Frontend
└── README.md
```

## API Credentials

Client ID: `PJHSPMNBLSP2UCKNSS33I8FT4NTI66QECEAC9DJSEJLROC008UC4BBD0C1S5DL5N`
Redirect URI: `http://localhost:8080/callback`
