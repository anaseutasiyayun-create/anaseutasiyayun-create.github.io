CREATE DATABASE IF NOT EXISTS family_dance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE family_dance;

CREATE TABLE directions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(60)  NOT NULL,
  name_ru      VARCHAR(60)  NOT NULL,
  slug         VARCHAR(60)  NOT NULL UNIQUE,
  description  TEXT,
  ages         VARCHAR(30)  NOT NULL,
  audience     SET('kids','teens','adults') NOT NULL,
  price        INT UNSIGNED NOT NULL DEFAULT 3000,
  sort         TINYINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE schedule (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  direction_id  INT UNSIGNED NOT NULL,
  weekday       TINYINT UNSIGNED NOT NULL,
  start_time    TIME NOT NULL,
  duration      SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  min_age       TINYINT UNSIGNED NOT NULL,
  max_age       TINYINT UNSIGNED NULL,
  level         ENUM('beginner','pro','kids') NOT NULL DEFAULT 'beginner',
  hall          VARCHAR(30) NOT NULL DEFAULT 'Зал 1',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_schedule_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE RESTRICT,
  INDEX idx_weekday (weekday, start_time)
) ENGINE=InnoDB;

CREATE TABLE applications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  student_age   TINYINT UNSIGNED NOT NULL,
  direction_id  INT UNSIGNED NULL,
  schedule_id   INT UNSIGNED NULL,
  comment       VARCHAR(500),
  status        ENUM('new','contacted','trial','enrolled','cancelled') NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL,
  CONSTRAINT fk_app_schedule  FOREIGN KEY (schedule_id)  REFERENCES schedule(id)   ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE admins (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  login          VARCHAR(50) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

INSERT INTO directions (id, name, name_ru, slug, description, ages, audience, sort) VALUES
  (1, 'Choreo', 'Хорео', 'choreo', 'Энергичное направление, которое объединяет уличные стили: хип-хоп, k-pop, джаз-фанк. Главное преимущество — никаких рамок.', '12+', 'teens,adults', 1),
  (2, 'Современная хореография', 'Современная хореография', 'modern', 'Гибкость, свобода самовыражения и индивидуальность танцора. Есть группы для начинающих, PRO и детская группа 7+.', '7+', 'kids,teens,adults', 2),
  (3, 'Jazz Funk', 'Джаз Фанк', 'jazzfunk', 'Современный и энергичный стиль, который раскрывает красоту, эстетику и уверенность в себе.', '12+', 'teens,adults', 3),
  (4, 'Contemporary', 'Контемпорари', 'contemporary', 'Экспрессивный современный танец на стыке модерна, классической хореографии и джаза.', '12+', 'teens,adults', 4),
  (5, 'High Heels', 'Хай-Хилс', 'heels', 'Эстетичное направление на высоких каблуках: управление телом, гибкость и чувство своего тела.', '18+', 'adults', 5),
  (6, 'Girl Choreo', 'Гёрли Хорео', 'girlchoreo', 'Нежный, женственный и пластичный стиль на основе джаз-фанка. Развивает гибкость, красоту и грацию движений.', '12+', 'teens,adults', 6),
  (7, 'Детская хореография', 'Детская хореография', 'kids', 'Детская эстрадная хореография: музыкальный слух, координация, осанка и уверенность в себе.', '5–7 лет', 'kids', 7),
  (8, 'Lady Dance', 'Леди Дэнс', 'ladydance', 'Современный стиль для взрослых: научиться красиво двигаться, раскрепоститься и стать пластичнее.', '18+', 'adults', 8);

INSERT INTO schedule (direction_id, weekday, start_time, min_age, max_age, level, hall)
SELECT d.direction_id, w.weekday, d.start_time, d.min_age, d.max_age, d.level, d.hall
FROM (
  SELECT 1 AS direction_id, 'mwf' AS days, '17:00' AS start_time, 12 AS min_age, NULL AS max_age, 'beginner' AS level, 'Зал 1' AS hall
  UNION ALL SELECT 2, 'mwf', '17:00', 12, NULL, 'beginner', 'Зал 2'
  UNION ALL SELECT 2, 'mwf', '18:00', 12, NULL, 'pro',      'Зал 1'
  UNION ALL SELECT 6, 'mwf', '18:00', 12, NULL, 'beginner', 'Зал 2'
  UNION ALL SELECT 2, 'mwf', '19:00', 12, NULL, 'beginner', 'Зал 1'
  UNION ALL SELECT 2, 'mwf', '20:00', 7,  11,   'kids',     'Зал 1'
  UNION ALL SELECT 3, 'mwf', '20:00', 16, NULL, 'beginner', 'Зал 2'
  UNION ALL SELECT 7, 'tt',  '18:00', 5,  7,    'kids',     'Зал 1'
  UNION ALL SELECT 4, 'tt',  '19:00', 12, NULL, 'beginner', 'Зал 1'
  UNION ALL SELECT 3, 'tt',  '20:00', 12, NULL, 'beginner', 'Зал 1'
  UNION ALL SELECT 5, 'tt',  '20:00', 18, NULL, 'beginner', 'Зал 2'
  UNION ALL SELECT 8, 'tt',  '20:00', 18, NULL, 'beginner', 'Зал 3'
) d
JOIN (
  SELECT 'mwf' AS days, 1 AS weekday UNION ALL SELECT 'mwf', 3 UNION ALL SELECT 'mwf', 5
  UNION ALL SELECT 'tt', 2 UNION ALL SELECT 'tt', 4
) w ON w.days = d.days;

INSERT INTO admins (login, password_hash) VALUES
  ('admin', '$2y$10$yy7KzG5o.72IqKu9GgWKveVH9kZqxLcCr1hudgGyAiJTCfa747Aya');
