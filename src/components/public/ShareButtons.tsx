import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = { url: string; title: string };

const pill =
  "inline-flex items-center rounded-full border border-border px-4 py-2 text-xs tracking-[0.06em] text-muted-foreground transition-colors duration-500 ease-out hover:border-primary/50 hover:text-primary";

export function ShareButtons({ url, title }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    {
      key: "facebook",
      label: t("share.facebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      key: "whatsapp",
      label: t("share.whatsapp"),
      href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`,
    },
    {
      key: "email",
      label: t("share.email"),
      href: `mailto:?subject=${enc(title)}&body=${enc(url)}`,
    },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable — still give feedback */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noreferrer noopener"
          className={pill}
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className={
          copied ? `${pill} border-primary/50 text-primary` : pill
        }
      >
        {copied ? t("share.copied") : t("share.copy")}
      </button>
    </div>
  );
}
