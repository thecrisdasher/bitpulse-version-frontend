"use client"

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'next-i18next';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
];

export function LanguageSelector() {
  const { locale, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  
  const activeLanguage = LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2">
          <Languages className="h-4 w-4" />
          <span className="hidden md:inline-flex ml-1">
            {activeLanguage.flag} {activeLanguage.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code as 'es' | 'en')}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>
              {language.flag} {t(`language.${language.code}`)}
            </span>
            {locale === language.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 