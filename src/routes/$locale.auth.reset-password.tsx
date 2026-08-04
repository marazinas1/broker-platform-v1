import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/brand/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/config";

export const Route = createFileRoute("/$locale/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { locale } = Route.useParams() as { locale: Locale };
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in the URL hash. Wait for the
    // auth client to consume it and emit a session, then allow submission.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If no hash exists after a short delay, the link is invalid.
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) setInvalid(true);
    }, 800);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("admin.auth.reset.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("admin.auth.reset.mismatch"));
      return;
    }
    setBusy(true);
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setDone(true);
    window.setTimeout(
      () => navigate({ to: "/$locale/admin", params: { locale }, replace: true }),
      1200,
    );
  }

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t("admin.auth.reset.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.auth.reset.subtitle")}</p>
        </div>
        {invalid ? (
          <p className="text-sm text-destructive">{t("admin.auth.reset.invalidLink")}</p>
        ) : done ? (
          <p className="text-sm">{t("admin.auth.reset.success")}</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="pw">{t("admin.auth.reset.password")}</Label>
              <Input
                id="pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">{t("admin.auth.reset.confirm")}</Label>
              <Input
                id="pw2"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !ready} className="w-full">
              {busy ? t("admin.auth.reset.submitting") : t("admin.auth.reset.submit")}
            </Button>
          </form>
        )}
      </div>
    </AuthCard>
  );
}
