import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplit } from "@/components/brand/AuthSplit";
import { AuthProviderSlot } from "@/components/brand/AuthProviderSlot";
import { BrandMark } from "@/components/brand/BrandMark";
import { supabase } from "@/integrations/supabase/client";
import { updateLastLogin } from "@/lib/auth/last-login.functions";
import { currentUserQueryOptions } from "@/lib/auth/current-user.functions";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import type { Locale } from "@/i18n/config";

const searchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/$locale/auth/login")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions),
  component: LoginPage,
});

/** Photography for the right column, taken from client configuration. */
function pickAuthImage(settings: {
  homepage_sections: { key: string; image?: string }[];
  primary_agent_photo_url: string | null;
}) {
  const hero = settings.homepage_sections.find((s) => s.key === "hero")?.image;
  return hero ?? settings.primary_agent_photo_url ?? null;
}

function LoginPage() {
  const { t } = useTranslation();
  const { locale } = Route.useParams() as { locale: Locale };
  const search = useSearch({ from: "/$locale/auth/login" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
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
    <AuthSplit
      imageUrl={pickAuthImage(settings)}
      imageAlt={t("admin.auth.login.image_alt")}
      brand={<BrandMark settings={settings} />}
    >
      <h1 className="font-heading text-4xl md:text-5xl">{t("admin.auth.login.title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("admin.auth.login.subtitle")}
      </p>

      <form className="mt-10 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.16em]">
            {t("admin.auth.login.email")}
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-md border-border bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.16em]">
            {t("admin.auth.login.password")}
          </Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-md border-border bg-card"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-md">
          {busy ? t("admin.auth.login.submitting") : t("admin.auth.login.submit")}
        </Button>
        <div className="pt-1">
          <Link
            to="/$locale/auth/forgot-password"
            params={{ locale }}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground hover:underline"
          >
            {t("admin.auth.login.forgot")}
          </Link>
        </div>
      </form>

      <AuthProviderSlot />
    </AuthSplit>
  );
}
