// Re-export everything from the central LanguageContext so existing imports keep working
export { useI18n, LanguageProvider, translations } from '@/contexts/LanguageContext';
export type { Language, TranslationKey } from '@/contexts/LanguageContext';
