import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { InquiriesList } from "@/components/admin/inquiries/InquiriesList";
import { adminInquiriesQueryOptions } from "@/lib/inquiries/admin.functions";

export const Route = createFileRoute("/$locale/admin/inquiries/")({
  component: InquiriesIndex,
});

function InquiriesIndex() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const { data } = useSuspenseQuery(adminInquiriesQueryOptions);
  const unread = data.filter((row) => row.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-2xl">{t("admin.pages.inquiries")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.inquiries.summary", { total: data.length, unread })}
        </p>
      </div>
      <InquiriesList rows={data} locale={locale} />
    </div>
  );
}
