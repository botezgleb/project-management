# TaskFlow

<p align="center">
  <img src="./screenshots/main.png" width="800"/>
</p>

NONSENSE — fullstack платформа для управления проектами и задачами с поддержкой Kanban-досок, drag-and-drop, realtime-обновлений и системой командной работы.

## Возможности

### Аутентификация
- Регистрация и вход пользователей
- JWT авторизация
- Access / Refresh токены
- Middleware для защиты API
- Разграничение ролей:
  - USER
  - ADMIN

### Управление проектами
- Создание проектов
- Редактирование проектов
- Удаление проектов
- Описание проекта
- Система участников проекта
- Роли участников:
  - OWNER
  - MEMBER

### Kanban-доска
- Создание колонок
- Перемещение колонок
- Drag-and-drop задач
- Drag-and-drop колонок
- Позиционирование элементов
- Автоматическое обновление порядка

### Управление задачами
- Создание задач
- Редактирование задач
- Удаление задач
- Поддержка описания задачи
- Модальное окно просмотра задачи
- Назначение исполнителей
- Хранение автора задачи
- Работа с позициями внутри колонок

### Realtime-функциональность
- WebSocket соединение через Socket.IO
- Realtime обновление доски
- Синхронизация изменений между пользователями

### Система друзей (пока не реализовано)
- Поиск пользователей по username
- Отправка заявок в друзья
- Принятие и отклонение заявок
- Список друзей
- Приглашение друзей в проекты

### Безопасность
- JWT проверка запросов
- Защита приватных маршрутов
- Хеширование паролей
- CORS настройки
- Проверка прав доступа к проектам

## Технологии

### Backend
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcrypt
- Socket.IO

### Frontend
- React
- TypeScript
- Vite
- Axios
- React Router DOM
- DnD Kit
- Socket.IO Client

### База данных
- PostgreSQL
- Prisma ORM

---

## Архитектура проекта

### Архитектура сервера

Route → Controller → Service → Repository → Prisma → PostgreSQL

### Используемые middleware
- authMiddleware - для доступа к защищенным эндпоинтам
- projectRoleMiddleware - для использования возможностей, доступных определенным ролям, например, только владелец проекта имеет право изменять название проекта
- projectAccessMiddleware - для доступа к проекту

---

## Установка и запуск

### 1. Клонирование проекта

```bash
git clone https://github.com/your-username/project-management.git

cd project-management
```

---

## Backend

### 2. Установка зависимостей

```bash
cd server
npm install
```

### 3. Создание `.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
ACCESS_SECRET_KEY=your_access_secret
REFRESH_SECRET_KEY=your_refresh_secret
CLIENT_URL=http://localhost:5173
SERVER_PORT=3000
```

### 4. Prisma

```bash
npx prisma migrate dev

npx prisma generate
```

### 5. Запуск backend

```bash
npm run dev
```

---

## Frontend

### 6. Установка зависимостей

```bash
cd client
npm install
```

### 7. Запуск frontend

```bash
npm run dev
```

---

## Скриншоты

### Главная страница

<p align="center">
  <img src="./screenshots/main.png" width="800"/>
</p>

<p align="center">
  <img src="./screenshots/main2.png" width="800"/>
</p>

### Канбан-доска
<p align="center">
  <img src="./screenshots/board.png" width="800"/>
</p>

### Авторизация
<p align="center">
  <img src="./screenshots/login.png" width="350"/>
  <img src="./screenshots/register.png" width="350"/>
</p>

### Просмотр задачи
<p align="center">
  <img src="./screenshots/task-modal.png" width="700"/>
</p>

### Управление проектами
<p align="center">
  <img src="./screenshots/projects.png" width="700"/>
</p>

---

## API

### Авторизация
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Проекты
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

### Колонки
- `POST /columns`
- `PATCH /columns/:id`
- `DELETE /columns/:id`

### Задачи
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/move`

### Друзья (пока не реализовано)
- `POST /friends/request`
- `POST /friends/accept/:requestId`
- `POST /friends/reject/:requestId`
- `GET /friends`
- `GET /friends/incoming`

### Пользователи (пока не реализовано)
- `GET /users/search`

---

## База данных

### Основные сущности
- User
- Project
- ProjectMember
- Column
- Task
- TaskAssignee
- FriendRequest
- Friendship
- RefreshToken

### Особенности БД
- Индексация полей
- Уникальные ограничения
- Связи One-to-Many
- Связи Many-to-Many
- Каскадное удаление
- Хранение refresh токенов

---

## Realtime взаимодействие

### Socket.IO события

#### Client → Server
- `join-project`
- `leave-project`

#### Server → Client
- `task-created`
- `task-updated`
- `task-deleted`
- `column-updated`

---

## Поток работы

1. Пользователь регистрируется
2. Создаёт проект
3. Добавляет колонки
4. Создаёт задачи
5. Приглашает участников
6. Команда работает в realtime режиме
7. Изменения синхронизируются через WebSocket

---

## Планируемые улучшения

### Аналитика
- Диаграмма Ганта
- Burndown chart
- Dashboard проекта
- Статистика задач

### AI и автоматизация
- Рекомендации исполнителей
- Прогноз сроков выполнения
- Анализ нагрузки команды

### UX/UI
- Тёмная тема
- Календарный вид
- Мобильная версия
- Настраиваемые dashboard

---

## Тестирование

Проверено:
- JWT авторизация
- Работа middleware
- CRUD операции
- Drag-and-drop
- Realtime обновления
- Работа Prisma
- Socket.IO соединения
- Обработка ошибок API
- Работа ролей и прав доступа