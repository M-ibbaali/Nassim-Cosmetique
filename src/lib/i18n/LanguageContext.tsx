"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: any; // Translation object for current locale
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  // Load from locale storage/cookies on mount
  useEffect(() => {
    const saved = localStorage.getItem('beautypos-locale') as Locale;
    if (saved && (saved === 'en' || saved === 'fr' || saved === 'ar')) {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beautypos-locale', locale);
    // Apply RTL to the document
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = {
    locale,
    setLocale,
    t: translations[locale],
    isRTL: locale === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
