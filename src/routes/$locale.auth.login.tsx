import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateLastLogin } from "@/lib/auth/last-login.functions";
import { currentUserQueryOptions } from "@/lib/auth/current-user.functions";
import type { Locale } from "@/i18n/config";

const searchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/$locale/auth/login")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { locale } = Route.useParams() as { locale: Locale };
  const search = useSearch({ from: "/$locale/auth/login" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    search.error ? t("admin.auth.login.generic") : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data.session) {
        setError(
          signInError?.message.toLowerCase().includes("invalid")
            ? t("admin.auth.login.invalid")
            : t("admin.auth.login.generic"),
        );
        return;
      }
      // Best-effort last-login update; never blocks navigation.
      void updateLastLogin().catch(() => undefined);
      await qc.invalidateQueries({ queryKey: currentUserQueryOptions.queryKey });
      const target = search.redirect ?? `/${locale}/admin`;
      await navigate({ to: target, replace: true });
    } catch {
      setError(t("admin.auth.login.generic"));
    } finally {
      // Always release the button so it can never hang on "Signing in...".
      setBusy(false);
    }
  }


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{t("admin.auth.login.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.auth.login.subtitle")}</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("admin.auth.login.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("admin.auth.login.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t("admin.auth.login.submitting") : t("admin.auth.login.submit")}
        </Button>
      </form>
      <div className="text-sm">
        <Link
          to="/$locale/auth/forgot-password"
          params={{ locale }}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("admin.auth.login.forgot")}
        </Link>
      </div>
    </div>
  );
}
