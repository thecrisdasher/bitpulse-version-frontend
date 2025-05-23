"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'next-i18next';

type Locale = 'es' | 'en';

interface LanguageContextType {
  locale: Locale;
  changeLanguage: (locale: Locale) => void;
}

const DEFAULT_LANGUAGE: Locale = 'es';

const LanguageContext = createContext<LanguageContextType>({
  locale: DEFAULT_LANGUAGE,
  changeLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale = DEFAULT_LANGUAGE }: LanguageProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // Cambiar idioma
  const changeLanguage = async (newLocale: Locale) => {
    try {
      // Guardar preferencia en localStorage (solo en cliente)
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', newLocale);
      }
      
      // Actualizar i18n
      await i18n.changeLanguage(newLocale);
      
      // Actualizar estado
      setLocale(newLocale);
      
      // Actualizar ruta manteniendo la misma página
      // En App Router necesitamos usar un enfoque diferente
      router.push(`${pathname}?locale=${newLocale}`);
    } catch (error) {
      console.error('Error cambiando idioma:', error);
    }
  };

  // Cargar idioma almacenado al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Locale;
      if (savedLanguage && savedLanguage !== locale) {
        changeLanguage(savedLanguage);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
} 