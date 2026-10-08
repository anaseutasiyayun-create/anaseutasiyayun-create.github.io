function seedTasks(today = new Date()) {
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  return [
    {
      title: 'Собрать структуру сайта',
      description: 'Карта страниц, сценарии заказа и бронирования',
      status: 'done',
      priority: 'high',
      deadline: day(-9),
      tags: ['ux'],
      assignee: 'Анастасия',
    },
    {
      title: 'Макет главной в Figma',
      description: 'Десктоп и мобильная версия, согласовать с заказчиком',
      status: 'done',
      priority: 'high',
      deadline: day(-5),
      tags: ['дизайн'],
      assignee: 'Марина',
    },
    {
      title: 'Сверстать шапку и меню',
      description: 'Логотип, навигация, бургер на мобильных',
      status: 'done',
      priority: 'medium',
      deadline: day(-3),
      tags: ['вёрстка'],
      assignee: 'Анастасия',
    },
    {
      title: 'Блок меню кофейни',
      description: 'Карточки напитков из JSON, фильтр по категориям',
      status: 'progress',
      priority: 'high',
      deadline: day(1),
      tags: ['вёрстка', 'js'],
      assignee: 'Анастасия',
    },
    {
      title: 'Форма бронирования столика',
      description: 'Валидация на клиенте, отправка через fetch, сообщение об успехе',
      status: 'progress',
      priority: 'high',
      deadline: day(-1),
      tags: ['js', 'api'],
      assignee: 'Илья',
    },
    {
      title: 'Эндпоинт POST /api/booking',
      description: 'Проверка даты и времени, запись в MySQL',
      status: 'progress',
      priority: 'medium',
      deadline: day(4),
      tags: ['api'],
      assignee: 'Илья',
    },
    {
      title: 'Галерея интерьера',
      description: 'Ленивая загрузка, WebP, лайтбокс',
      status: 'todo',
      priority: 'medium',
      deadline: day(6),
      tags: ['вёрстка'],
      assignee: 'Марина',
    },
    {
      title: 'Проверить вёрстку в Safari',
      description: 'iOS 16+, особое внимание форме и sticky-шапке',
      status: 'todo',
      priority: 'medium',
      deadline: day(2),
      tags: ['тесты'],
      assignee: 'Анастасия',
    },
    {
      title: 'Оптимизировать изображения',
      description: 'Сжать фото, добавить srcset',
      status: 'todo',
      priority: 'low',
      deadline: day(9),
      tags: ['скорость'],
      assignee: null,
    },
    {
      title: 'Карта и контакты',
      description: 'Яндекс Карты, часы работы, кнопка звонка',
      status: 'todo',
      priority: 'low',
      deadline: null,
      tags: ['вёрстка'],
      assignee: 'Марина',
    },
    {
      title: 'Написать README',
      description: 'Описание, стек, инструкция по запуску',
      status: 'todo',
      priority: 'low',
      deadline: day(12),
      tags: ['документация'],
      assignee: null,
    },
    {
      title: 'Доступность: фокус и контраст',
      description: 'Проверить навигацию с клавиатуры и контраст текста',
      status: 'todo',
      priority: 'high',
      deadline: day(3),
      tags: ['ux', 'тесты'],
      assignee: 'Илья',
    },
  ];
}

module.exports = { seedTasks };
