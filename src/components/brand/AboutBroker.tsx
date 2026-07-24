import { useTranslation } from "react-i18next";

/** Short introduction block. Copy comes from the messages file, not hardcoded. */
export function AboutBroker() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("home.about")}
          </div>
        </div>
        <div className="md:col-span-8">
          <p className="font-heading text-3xl leading-[1.15] text-foreground md:text-5xl">
            {t("home.about_body")}
          </p>
        </div>
      </div>
    </section>
  );
}
