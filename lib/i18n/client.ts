// Este archivo solo se ejecutará en el cliente
'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { InitOptions } from 'i18next';

const i18nConfig: InitOptions = {
  lng: 'es',
  fallbackLng: 'en',
  ns: ['common', 'chart', 'crypto'],
  defaultNS: 'common',
  fallbackNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
  },
};

i18next
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`./locales/${language}/${namespace}.json`))
  )
  .init(i18nConfig);

export default i18next; 