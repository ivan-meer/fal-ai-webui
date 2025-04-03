<div align="center">

# 🎨 FAL.AI WebUI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.0-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC.svg)](https://tailwindcss.com/)

<img src="./images/screenshot.png" alt="FAL.AI WebUI Screenshot" width="600"/>

Пользовательский интерфейс для генерации изображений и видео с использованием FAL.AI API

[🚀 Начало работы](#-начало-работы) • 
[📖 Документация](#-документация) • 
[🛠 Разработка](#-разработка) • 
[📝 API](#-api)

</div>

## 🚀 Начало работы

```bash
# Установка зависимостей
npm install

# Запуск сервера разработки
npm run dev
```

## 📖 Документация

### Основные компоненты

- [GenerationPage](./src/components/GenerationPage.tsx) - Главная страница генерации
- [TextToImageForm](./src/components/TextToImageForm.tsx) - Форма генерации изображений
- [TextToVideoForm](./src/components/TextToVideoForm.tsx) - Форма генерации видео
- [HistoryPanel](./src/components/HistoryPanel.tsx) - Панель истории генераций

### Утилиты и хелперы

- [fal-client.ts](./src/lib/fal-client.ts) - Клиент для работы с FAL.AI API
- [history-store.ts](./src/lib/history-store.ts) - Хранилище истории генераций
- [task-queue.ts](./src/lib/task-queue.ts) - Управление очередью задач

## 🛠 Разработка

### Структура проекта

```
src/
├── app/              # Next.js App Router
├── components/       # React компоненты
├── lib/              # Утилиты и хелперы
└── styles/           # Стили
```

### TODO и планы развития

- [ ] Добавить поддержку дополнительных моделей
- [ ] Улучшить UI/UX интерфейса
- [ ] Реализовать сохранение настроек
- [ ] Добавить продвинутые настройки генерации
- [ ] Оптимизировать производительность

## 📝 API

API документация доступна в [openapi.yaml](./openapi.yaml)

### Основные эндпоинты

- `/api/generate/image` - Генерация изображений
- `/api/generate/video` - Генерация видео

## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле [LICENSE](./LICENSE).