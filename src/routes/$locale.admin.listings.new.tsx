import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/admin/listings/ListingForm";
import { EMPTY_VALUES } from "@/components/admin/listings/listing-form-state";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";

export const Route = createFileRoute("/$locale/admin/listings/new")({
  component: NewListing,
});

function NewListing() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <div className="space-y-6">
      <Link
        to="/$locale/admin/listings"
        params={{ locale }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("admin.pages.listings")}
      </Link>
      <h1 className="font-heading text-2xl">{t("admin.listings.new")}</h1>
      <ListingForm
        initial={EMPTY_VALUES}
        locales={settings.enabled_locales}
        status={null}
        slug={null}
        images={[]}
      />
    </div>
  );
}
