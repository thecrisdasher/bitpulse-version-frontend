'use client';

import { useEffect } from 'react';
import i18next from '@/lib/i18n/client';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: string;
}) {
  useEffect(() => {
    i18next.changeLanguage(locale);
  }, [locale]);

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
} 