import { useTranslation } from "react-i18next";

import { Textarea } from "@/components/ui/textarea";
import { CONTENT_SECTION_KEYS } from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/**
 * Structured public content blocks. Stored as
 * [{ key, items: { en: [...], de: [...] } }] — exactly the shape the public
 * detail page already renders. Edited as one bullet per line.
 */
export function ContentSectionsEditor({
  form,
  lang,
}: {
  form: ListingFormApi;
  lang: string;
}) {
  const { t } = useTranslation();

  function itemsFor(key: string): string[] {
    const section = (form.values.content_sections ?? []).find((s) => s.key === key);
    return section?.items?.[lang] ?? [];
  }

  return (
    <FormSection
      title={t("admin.listings.sections.content")}
      description={t("admin.listings.help.content")}
    >
      <div className="grid gap-4">
        {CONTENT_SECTION_KEYS.map((key) => (
          <FieldRow
            key={key}
            label={`${t(`listings.detail.sections.${key}`)} (${lang.toUpperCase()})`}
          >
            <Textarea
              rows={5}
              value={itemsFor(key).join("\n")}
              onChange={(e) =>
                form.setSectionItems(key, lang, e.target.value.split("\n"))
              }
            />
          </FieldRow>
        ))}
      </div>
    </FormSection>
  );
}
