import { useTranslation } from "react-i18next";

/** Seller submissions are private: URLs are short-lived signed URLs. */
export function SellerPhotos({ urls }: { urls: string[] }) {
  const { t } = useTranslation();
  if (urls.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-lg">{t("admin.inquiries.detail.photos")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={url}
              alt={t("admin.inquiries.detail.photo_alt", { n: i + 1 })}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </a>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("admin.inquiries.detail.photos_private")}
      </p>
    </section>
  );
}
