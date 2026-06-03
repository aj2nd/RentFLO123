import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'ml';
export type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isLoading: false,
});

const STORAGE_KEY = 'rentflo_language';

const loadTranslations = async (lang: Language) => {
  switch (lang) {
    case 'hi': return (await import('./translations/hi')).default;
    case 'kn': return (await import('./translations/kn')).default;
    case 'ta': return (await import('./translations/ta')).default;
    case 'ml': return (await import('./translations/ml')).default;
    case 'en':
    default:   return (await import('./translations/en')).default;
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    const initialLang: Language = saved && ['en','hi','kn','ta','ml'].includes(saved) ? saved : 'en';
    setLang(initialLang);
    loadLanguage(initialLang);
  }, []);

  const loadLanguage = async (lang: Language) => {
    setIsLoading(true);
    try {
      const trans = await loadTranslations(lang);
      setTranslations(trans);
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (error) {
      console.error('Failed to load translations for', lang);
      if (lang !== 'en') {
        const fallback = await loadTranslations('en');
        setTranslations(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback((lang: Language) => {
    if (lang === language) return;
    setLang(lang);
    loadLanguage(lang);
  }, [language]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key] ?? key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useI18n() {
  return useLanguage();
}
