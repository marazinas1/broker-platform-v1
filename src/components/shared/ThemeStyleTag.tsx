import type { SiteSettings } from "@/types/site-settings";

/**
 * Emits a <style>:root { … }</style> block with CSS variable overrides driven by
 * site_settings. Rendered inside <body> during SSR; :root custom properties
 * apply globally regardless of tag placement.
 */
export function ThemeStyleTag({ settings }: { settings: SiteSettings }) {
  const rules: string[] = [];
  if (settings.primary_color) rules.push(`--primary: ${settings.primary_color};`);
  if (settings.secondary_color) rules.push(`--secondary: ${settings.secondary_color};`);
  if (settings.accent_color) rules.push(`--accent: ${settings.accent_color};`);
  if (settings.font_heading) rules.push(`--font-heading: ${settings.font_heading};`);
  if (settings.font_body) rules.push(`--font-body: ${settings.font_body};`);

  if (rules.length === 0) return null;
  const css = `:root{${rules.join("")}}`;
  return <style data-theme-overrides dangerouslySetInnerHTML={{ __html: css }} />;
}
