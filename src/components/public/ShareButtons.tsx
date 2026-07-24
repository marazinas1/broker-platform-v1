import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = { url: string; title: string };

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-foreground"
        >
          {l.label}
        </a>
      ))}
      <button type="button" onClick={copy} className="hover:text-foreground">
        {copied ? t("share.copied") : t("share.copy")}
      </button>
    </div>
  );
}
