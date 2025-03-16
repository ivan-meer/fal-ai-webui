'use client';

import { createContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { i18n } from 'i18next';
import { initI18next } from '@/lib/i18n-client';
import { defaultNS } from '@/lib/i18n-config';

interface TranslationsProviderProps {
  children: React.ReactNode;
  locale: string;
}

export interface TranslationContextProps {
  i18n: i18n | null;
  t: (key: string, options?: any) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

export const TranslationContext = createContext<TranslationContextProps>({
  i18n: null,
  t: (key: string) => key,
  locale: 'en',
  setLocale: () => {}
});

export const TranslationsProvider = ({ children, locale }: TranslationsProviderProps) => {
  const [currentLocale, setCurrentLocale] = useState(locale);
  const [i18nInstance, setI18nInstance] = useState<i18n | null>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    // ロケールが変更されたときにdocumentのlangを更新
    document.documentElement.lang = currentLocale;
    
    // i18nインスタンスの初期化
    const initializeI18n = async () => {
      const i18nInstance = await initI18next(currentLocale, defaultNS);
      setI18nInstance(i18nInstance);
    };
    
    initializeI18n();
  }, [currentLocale]);

  const t = (key: string, options?: any): string => {
    if (!i18nInstance) return key;
    // i18nの戻り値をstringに強制的に変換
    return String(i18nInstance.t(key, options));
  };

  const setLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // ロケールを更新
    i18nInstance?.changeLanguage(newLocale);
    setCurrentLocale(newLocale);
    
    // localStorage に保存（オプション）
    localStorage.setItem('locale', newLocale);
  };

  return (
    <TranslationContext.Provider value={{ i18n: i18nInstance, t, locale: currentLocale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationsProvider; 