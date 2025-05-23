'use client';

import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getOptions } from './settings';
import { useEffect } from 'react';

// Inicializar i18next para el cliente
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`../../public/locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['cookie']
    }
  });

export function useTranslation(lng?: string, ns?: string, options: any = {}) {
  const ret = useTranslationOrg(ns, options);
  
  useEffect(() => {
    if (lng && ret.i18n.resolvedLanguage !== lng) {
      ret.i18n.changeLanguage(lng);
    }
  }, [lng, ret.i18n]);
  
  return ret;
} 