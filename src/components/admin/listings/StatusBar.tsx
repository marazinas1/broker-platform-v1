import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { allowedTransitions } from "@/lib/listings/admin-schema";
import {
  adminListingsQueryOptions,
  changeListingStatus,
} from "@/lib/listings/admin.functions";

/**
 * Status transitions. The list of targets mirrors the database status-flow
 * trigger; the database still has the final say (publish permission and
 * country energy validation), so its error message is what we surface.
 */
export function StatusBar({
  listingId,
  status,
  slug,
  dirty,
  onChanged,
}: {
  listingId: string;
  status: string | null;
  slug: string | null;
  dirty: boolean;
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const targets = allowedTransitions(status);
  const isPublic = status === "active" || status === "coming_soon";

  async function apply(next: string) {
    setBusy(next);
    try {
      await changeListingStatus({
        data: { id: listingId, status: next as never },
      });
      queryClient.invalidateQueries(adminListingsQueryOptions);
      onChanged();
      toast.success(t("admin.listings.statusChanged"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {t("admin.listings.fields.status")}
      </span>
      <Badge variant={isPublic ? "default" : "secondary"}>
        {t(`listings.status.${status ?? "draft"}`)}
      </Badge>

      {isPublic && slug ? (
        <Link
          to="/$locale/immobilien/$slug"
          params={{ locale: i18n.language, slug }}
          target="_blank"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("admin.listings.viewPublic")}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ) : null}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {dirty ? (
          <span className="text-xs text-muted-foreground">
            {t("admin.listings.saveBeforeStatus")}
          </span>
        ) : null}
        {targets.map((target) => (
          <Button
            key={target}
            type="button"
            size="sm"
            variant="outline"
            disabled={dirty || busy !== null}
            onClick={() => void apply(target)}
          >
            {t(`admin.listings.statusAction.${target}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
