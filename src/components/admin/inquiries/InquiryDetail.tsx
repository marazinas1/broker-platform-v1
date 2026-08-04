import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { pickLocalized } from "@/lib/listings/format";
import { payloadEntries, type AdminInquiryDetailView } from "./detail-types";
import { setInquiryStatus } from "@/lib/inquiries/admin.functions";
import { InquiryStatusBadge, InquiryTypeBadge, formatInquiryDate } from "./InquiryBadges";
import { SellerPhotos } from "./SellerPhotos";

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

export function InquiryDetail({
  detail,
  locale,
}: {
  detail: AdminInquiryDetailView;
  locale: string;
}) {
  const { t } = useTranslation();
  const { inquiry, photoUrls } = detail;
  const queryClient = useQueryClient();
  const updateStatus = useServerFn(setInquiryStatus);

  const mutation = useMutation({
    mutationFn: (status: "read" | "handled") =>
      updateStatus({ data: { id: inquiry.id, status } }),
    onSuccess: () => {
      toast.success(t("admin.inquiries.detail.status_saved"));
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiry", inquiry.id] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    },
    onError: () => toast.error(t("admin.inquiries.detail.status_error")),
  });

  const details = payloadEntries(inquiry.payload);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <InquiryTypeBadge type={inquiry.type} />
        <InquiryStatusBadge status={inquiry.status} />
        <span className="text-xs text-muted-foreground">
          {formatInquiryDate(inquiry.created_at, locale)}
        </span>
        <div className="ml-auto flex gap-2">
          {inquiry.status === "handled" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("read")}
            >
              {t("admin.inquiries.detail.mark_open")}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("handled")}
            >
              {t("admin.inquiries.detail.mark_handled")}
            </Button>
          )}
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h1 className="font-heading text-2xl">{inquiry.name || inquiry.email}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${inquiry.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              {inquiry.email}
            </a>
          </Button>
          {inquiry.phone ? (
            <>
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${inquiry.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {inquiry.phone}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={waLink(inquiry.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("admin.inquiries.detail.whatsapp")}
                </a>
              </Button>
            </>
          ) : null}
        </div>
      </section>

      {inquiry.listing ? (
        <section className="space-y-1">
          <h2 className="font-heading text-lg">{t("admin.inquiries.detail.listing")}</h2>
          <Link
            to="/$locale/admin/listings/$id"
            params={{ locale, id: inquiry.listing.id }}
            className="text-sm underline underline-offset-4"
          >
            {pickLocalized(inquiry.listing.title, locale) || inquiry.listing.slug}
          </Link>
        </section>
      ) : null}

      {inquiry.message ? (
        <section className="space-y-2">
          <h2 className="font-heading text-lg">{t("admin.inquiries.detail.message")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{inquiry.message}</p>
        </section>
      ) : null}

      {details.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-heading text-lg">{t("admin.inquiries.detail.details")}</h2>
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border text-sm">
            {details.map(([key, value]) => (
              <div key={key} className="flex gap-4 px-4 py-2">
                <dt className="w-1/2 text-muted-foreground">
                  {t(`admin.inquiries.fields.${key}`, { defaultValue: key })}
                </dt>
                <dd className="w-1/2">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <SellerPhotos urls={photoUrls} />

      <p className="text-xs text-muted-foreground">
        {t("admin.inquiries.detail.locale")}: {inquiry.locale ?? "—"} ·{" "}
        {t("admin.inquiries.detail.source")}: {inquiry.source ?? "—"}
      </p>
    </div>
  );
}
