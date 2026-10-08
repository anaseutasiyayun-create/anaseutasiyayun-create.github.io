# TaskBoard — канбан-доска на Node.js

Проект преддипломной практики (ГАПОУ «ОКЭИ», 2025): REST API на Node.js + Express и одностраничный фронтенд на чистом JavaScript.

## Возможности

- Три колонки: «К выполнению», «В работе», «Готово»; лимит задач в работе (WIP) с предупреждением
- Перетаскивание карточек между колонками (HTML5 Drag & Drop) с оптимистичным обновлением и откатом при ошибке
- Плавный перенос карточек на новое место (FLIP-анимация через Web Animations API)
- Создание, редактирование и удаление задач в модальном окне (`<dialog>`)
- Приоритеты, теги, исполнители, дедлайны с подсветкой «сегодня», «скоро» и «просрочено»
- Фильтры по приоритету, тегу и исполнителю, поиск с debounce, прогресс выполнения
- Светлая и тёмная тема (по системной настройке или вручную, выбор запоминается)
- Работа с клавиатуры: `N` — новая задача, `/` — поиск, `T` — тема, `←` `→` — перенос выбранной карточки, `?` — справка
- Два хранилища с одинаковым интерфейсом: **JSON-файл** (по умолчанию) или **MySQL**
- Валидация данных на сервере и unit-тесты валидатора (`node --test`)

## REST API

| Метод  | URL               | Описание                                   |
|--------|-------------------|--------------------------------------------|
| GET    | `/api/tasks`      | Список задач, фильтры `?status=todo&tag=js&assignee=Илья&q=...` |
| GET    | `/api/tasks/:id`  | Одна задача                                |
| POST   | `/api/tasks`      | Создать задачу                             |
| PATCH  | `/api/tasks/:id`  | Изменить часть полей                       |
| DELETE | `/api/tasks/:id`  | Удалить задачу                             |
| GET    | `/api/stats`      | Количество задач по статусам               |

Пример:

```bash
curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Сверстать футер\",\"priority\":\"high\",\"tags\":[\"вёрстка\"],\"assignee\":\"Марина\"}"
```

Ответ `201 Created`:

```json
{ "id": 13, "title": "Сверстать футер", "status": "todo", "priority": "high", "tags": ["вёрстка"], "assignee": "Марина", "description": "", "deadline": null, "createdAt": "...", "updatedAt": "..." }
```

Ошибки валидации возвращаются с кодом `400`: `{ "errors": ["Название: от 3 до 120 символов"] }`.

## Стек

Node.js 18+, Express, mysql2, JavaScript ES6+ (fetch, async/await, Drag & Drop API), HTML5, CSS3 (Grid), npm, Git.

## Запуск

```bash
npm install
npm start          # http://localhost:3000
npm test           # тесты валидации
```

С MySQL вместо JSON-файла (таблица создастся сама, таблица от первой версии получит новые колонки):

```bash
# PowerShell
$env:DB_HOST="localhost"; $env:DB_USER="root"; $env:DB_PASS=""; $env:DB_NAME="taskboard"; npm start
```

## Структура

```
├── server.js          — маршруты API и раздача статики
├── validate.js        — валидация задач (+ validate.test.js)
├── store/
│   ├── index.js       — выбор хранилища
│   ├── seed.js        — стартовые задачи (дедлайны считаются от текущей даты)
│   ├── jsonStore.js   — хранение в data/tasks.json
│   └── mysqlStore.js  — хранение в MySQL
└── public/            — фронтенд (index.html, app.js, style.css)
```
