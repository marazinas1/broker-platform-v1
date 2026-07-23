import { I18nextProvider } from "react-i18next";
import { useMemo, type ReactNode } from "react";

import { getI18n, type Locale } from "./config";

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const instance = useMemo(() => getI18n(locale), [locale]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
