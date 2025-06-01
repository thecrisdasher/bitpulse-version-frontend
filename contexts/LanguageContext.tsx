"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isClient, setIsClient] = useState(false);

  // Marcar cuando estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cambiar idioma con useCallback para estabilidad
  const changeLanguage = useCallback(async (newLocale: Locale) => {
    try {
      // Guardar preferencia en localStorage (solo en cliente)
      if (isClient) {
        localStorage.setItem('language', newLocale);
        // También establecer cookie para compatibilidad con servidor
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;
      }
      
      // Actualizar estado
      setLocale(newLocale);
      
      // Actualizar ruta manteniendo la misma página
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('locale', newLocale);
      router.push(`${pathname}?${searchParams.toString()}`);
    } catch (error) {
      console.error('Error cambiando idioma:', error);
    }
  }, [router, pathname, isClient]);

  // Cargar idioma almacenado al iniciar (solo una vez)
  useEffect(() => {
    if (isClient) {
      const savedLanguage = localStorage.getItem('language') as Locale;
      if (savedLanguage && savedLanguage !== locale) {
        setLocale(savedLanguage);
      }
    }
  }, [isClient]); // Solo depende de isClient

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
} 