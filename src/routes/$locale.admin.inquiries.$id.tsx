import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { InquiryDetail } from "@/components/admin/inquiries/InquiryDetail";
import { adminInquiryQueryOptions } from "@/lib/inquiries/admin.functions";

export const Route = createFileRoute("/$locale/admin/inquiries/$id")({
  component: InquiryDetailPage,
});

function InquiryDetailPage() {
  const { t } = useTranslation();
  const { locale, id } = Route.useParams();
  const { data } = useSuspenseQuery(adminInquiryQueryOptions(id));

  return (
    <div className="space-y-6">
      <Link
        to="/$locale/admin/inquiries"
        params={{ locale }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("admin.inquiries.detail.back")}
      </Link>
      <InquiryDetail detail={data} locale={locale} />
    </div>
  );
}
