import en from "./en.json";
import hi from "./hi.json";

export const LANGUAGE_STORAGE_KEY = "localdrop-language";
export const languages = ["en", "hi"] as const;

export type Language = (typeof languages)[number];
export type TranslationKey = keyof typeof en;

const dictionaries: Record<Language, Record<string, string>> = { en, hi };

export function normalizeLanguage(value?: string | null): Language {
  return value?.toLowerCase().startsWith("hi") ? "hi" : "en";
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function translate(language: Language, key: TranslationKey, params?: Record<string, string | number>) {
  const template = dictionaries[language][key] || dictionaries.en[key] || key;
  if (!params) return template;

  return Object.entries(params).reduce(
    (message, [param, value]) => message.replaceAll(`{${param}}`, String(value)),
    template
  );
}
