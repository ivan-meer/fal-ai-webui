'use client';

import { useContext } from 'react';
import { TranslationContext } from '@/components/TranslationsProvider';

export const useTranslations = () => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  
  return context;
}; 