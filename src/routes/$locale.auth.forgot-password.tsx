import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/brand/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/config";

export const Route = createFileRoute("/$locale/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { locale } = Route.useParams() as { locale: Locale };
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    });
    setBusy(false);
    setDone(true);
  }

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t("admin.auth.forgot.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.auth.forgot.subtitle")}</p>
        </div>
        {done ? (
          <p className="text-sm">{t("admin.auth.forgot.success")}</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("admin.auth.forgot.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? t("admin.auth.forgot.submitting") : t("admin.auth.forgot.submit")}
            </Button>
          </form>
        )}
        <div className="text-sm">
          <Link
            to="/$locale/auth/login"
            params={{ locale }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("admin.auth.forgot.back")}
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
