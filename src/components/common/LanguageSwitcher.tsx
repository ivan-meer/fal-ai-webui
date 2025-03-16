import React from 'react';
import { useTranslations } from '@/lib/useTranslations';

const LanguageSwitcher: React.FC = () => {
  const { t, locale, setLocale } = useTranslations();

  const toggleLanguage = () => {
    const newLanguage = locale === 'en' ? 'ja' : 'en';
    setLocale(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      {t('language.switchTo')}
    </button>
  );
};

export default LanguageSwitcher; 