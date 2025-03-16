'use client';

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from '@/lib/i18n-config';

// クライアントサイドでi18nを初期化する関数
export const initI18next = async (lng: string, ns: string | string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) =>
      import(`../../public/locales/${language}/${namespace}.json`)
    ))
    .init(getOptions(lng, ns));
  
  return i18nInstance;
};

// クライアントサイドでuseTranslationフックを使用するためのラッパー
export async function useTranslation(lng: string, ns: string | string[], options: any = {}) {
  const i18nextInstance = await initI18next(lng, ns);
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options.keyPrefix),
    i18n: i18nextInstance
  };
} 