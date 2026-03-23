'use client';

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

export type Locale = 'ar' | 'en';

const LOCALE_STORAGE_KEY = 'solocoder_locale';

type LocaleContextValue = {
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeListeners = new Set<() => void>();

function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ar';
}

function notifyLocaleListeners() {
  for (const listener of localeListeners) {
    listener();
  }
}

function updateStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  notifyLocaleListeners();
}

function subscribeToLocale(onStoreChange: () => void) {
  localeListeners.add(onStoreChange);

  if (typeof window === 'undefined') {
    return () => {
      localeListeners.delete(onStoreChange);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    localeListeners.delete(onStoreChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function getServerLocaleSnapshot(): Locale {
  return 'ar';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, readStoredLocale, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: updateStoredLocale,
      direction: getDirection(locale),
      isArabic: locale === 'ar'
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return context;
}
