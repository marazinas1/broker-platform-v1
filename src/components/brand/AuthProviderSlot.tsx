import { useTranslation } from "react-i18next";

/**
 * Layout slot for third-party sign-in. The Google button is rendered
 * disabled on purpose: the visual space is reserved now, the OAuth flow is
 * wired in a later step. No provider call happens here.
 */
export function AuthProviderSlot() {
  const { t } = useTranslation();

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("admin.auth.login.or")}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        disabled
        aria-disabled="true"
        title={t("admin.auth.login.google_soon")}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleGlyph />
        {t("admin.auth.login.google")}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t("admin.auth.login.google_soon")}
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="h-4 w-4 shrink-0">
      <path
        fill="currentColor"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86a5.28 5.28 0 0 1-4.96-3.65H1.05v2.34A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="currentColor"
        opacity=".45"
        d="M4.04 10.77a5.4 5.4 0 0 1 0-3.44V4.99H1.05a9 9 0 0 0 0 8.02l2.99-2.24Z"
      />
      <path
        fill="currentColor"
        opacity=".85"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 1.05 4.99l2.99 2.34A5.28 5.28 0 0 1 9 3.58Z"
      />
    </svg>
  );
}
