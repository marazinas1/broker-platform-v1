import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { inquiryTypeKey, type InquiryStatus } from "@/lib/inquiries/types";

export function InquiryTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className="font-normal">
      {t(`admin.inquiries.types.${inquiryTypeKey(type)}`)}
    </Badge>
  );
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant={status === "new" ? "default" : status === "handled" ? "secondary" : "outline"}
      className="font-normal"
    >
      {t(`admin.inquiries.status.${status}`)}
    </Badge>
  );
}

export function formatInquiryDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
