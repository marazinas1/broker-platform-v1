import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "@/messages/de.json";
import en from "@/messages/en.json";

export const SUPPORTED_LOCALES = ["de", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

let initialized = false;

export function getI18n(locale: Locale) {
  if (!initialized) {
    i18n.use(initReactI18next).init({
      resources: {
        de: { translation: de },
        en: { translation: en },
      },
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    initialized = true;
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return i18n;
}

/** Pure translation lookup usable during SSR head() without React context. */
export function translate(locale: Locale, key: string): string {
  const dict = locale === "de" ? de : en;
  const parts = key.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof node === "string" ? node : key;
}
