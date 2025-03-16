import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation as useNextTranslation } from 'next-i18next';

interface I18nContextType {
  t: (key: string, options?: any) => string;
  changeLanguage: (locale: string) => Promise<void>;
  currentLanguage: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { t, i18n } = useNextTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState(router.locale || 'en');

  useEffect(() => {
    setCurrentLanguage(router.locale || 'en');
  }, [router.locale]);

  const changeLanguage = async (locale: string) => {
    // 現在のパスを維持したまま言語を切り替える
    await router.push(router.asPath, router.asPath, { locale });
  };

  return (
    <I18nContext.Provider value={{ t, changeLanguage, currentLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}; 