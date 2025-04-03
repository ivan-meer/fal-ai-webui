// Статические русские переводы
export const useTranslations = () => {
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'generation.result.seed': 'Сид',
      'generation.result.random': 'Случайный',
      'generation.result.resolution': 'Разрешение',
      'generation.result.prompt': 'Промпт',
      'generation.result.noPromptData': 'Нет данных промпта',
      'buttons.copy': 'Копировать',
      'buttons.downloadImage': 'Скачать изображение',
      'buttons.downloadVideo': 'Скачать видео',
      'navigation.newGeneration': 'Новая генерация',
      'navigation.history': 'История',
      'generationType.image': 'Изображение',
      'generationType.video': 'Видео',
      'generation.result.imageTitle': 'Результат генерации изображения',
      'generation.result.videoTitle': 'Результат генерации видео',
      'generation.result.willAppearHere': 'Результат появится здесь'
    };
    return translations[key] || key;
  };

  return { t, locale: 'ru' };
};
