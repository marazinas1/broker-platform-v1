import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ImageIcon, Mail, Phone } from "lucide-react";

import { pickLocalized } from "@/lib/listings/format";
import { inquiryPreview, type AdminInquiryRow } from "@/lib/inquiries/types";
import { cn } from "@/lib/utils";
import { InquiryStatusBadge, InquiryTypeBadge, formatInquiryDate } from "./InquiryBadges";

export function InquiriesList({
  rows,
  locale,
}: {
  rows: AdminInquiryRow[];
  locale: string;
}) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t("admin.inquiries.empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {rows.map((row) => (
        <li
          key={row.id}
          className={cn("transition-colors hover:bg-muted/40", row.status === "new" && "bg-muted/20")}
        >
          <Link
            to="/$locale/admin/inquiries/$id"
            params={{ locale, id: row.id }}
            className="block px-4 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <InquiryTypeBadge type={row.type} />
              <InquiryStatusBadge status={row.status} />
              <span className="ml-auto text-xs text-muted-foreground">
                {formatInquiryDate(row.created_at, locale)}
              </span>
            </div>

            <p className="mt-2 font-medium">{row.name || row.email}</p>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {row.email}
              </span>
              {row.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {row.phone}
                </span>
              ) : null}
              {row.photo_paths?.length ? (
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {t("admin.inquiries.photos_count", { n: row.photo_paths.length })}
                </span>
              ) : null}
            </div>

            {row.listing ? (
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">
                  {t("admin.inquiries.about")}:{" "}
                </span>
                {pickLocalized(row.listing.title, locale) || row.listing.slug}
              </p>
            ) : null}

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {inquiryPreview(row)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
