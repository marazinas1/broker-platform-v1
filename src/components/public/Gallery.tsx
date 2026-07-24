import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/config";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";

type ImageInput = {
  id: string | null;
  variants: any;
  alt_text: any;
  sort_order: number | null;
  is_primary: boolean | null;
};

type Props = {
  images: ImageInput[];
  locale: Locale;
  title: string;
};

export function Gallery({ images, locale, title }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const list = images.filter((i) => pickImageUrl(i.variants, "large"));

  useEffect(() => {
    if (openIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
      if (e.key === "ArrowRight") setOpenIdx((i) => (i == null ? i : (i + 1) % list.length));
      if (e.key === "ArrowLeft")
        setOpenIdx((i) => (i == null ? i : (i - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, list.length]);

  if (list.length === 0) {
    return <div className="aspect-[16/9] w-full bg-muted" />;
  }

  const hero = list[0]!;
  const rest = list.slice(1, 5);

  return (
    <>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setOpenIdx(0)}
          className="relative aspect-[4/3] w-full overflow-hidden bg-muted md:col-span-3 md:aspect-[16/10]"
        >
          <img
            src={pickImageUrl(hero.variants, "large") ?? ""}
            alt={pickLocalized(hero.alt_text, locale) || title}
            className="h-full w-full object-cover"
          />
        </button>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
          {rest.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setOpenIdx(i + 1)}
              className="relative aspect-[4/3] w-full overflow-hidden bg-muted"
            >
              <img
                src={pickImageUrl(img.variants, "medium") ?? ""}
                alt={pickLocalized(img.alt_text, locale) || title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {openIdx != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={() => setOpenIdx(null)}
        >
          <img
            src={pickImageUrl(list[openIdx]!.variants, "large") ?? ""}
            alt={pickLocalized(list[openIdx]!.alt_text, locale) || title}
            className="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIdx(null);
            }}
            className="absolute right-4 top-4 rounded-sm bg-background/10 px-3 py-1 text-sm text-white hover:bg-background/20"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
