'use client';

import { createContext, useContext } from 'react';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  setLocale: () => {}
});

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const defaultLocale = 'es';
export const locales = ['es', 'en'] as const;
export type ValidLocale = typeof locales[number]; 