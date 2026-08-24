import englishText from "@/lib/englishCopy";

export type TranslationKey = string;

const copy = englishText as Record<string, string>;

/** English-only copy helper retained to keep existing page text calls concise. */
export function useI18n() {
  return {
    t: (key: TranslationKey): string => copy[key] ?? key,
  };
}
