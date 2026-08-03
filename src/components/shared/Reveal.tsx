import { useEffect, useRef, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Stagger in milliseconds — grid cards pass index * 80 or similar. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll reveal, CSS-only motion. The element renders fully in the SSR HTML;
 * the hidden state is applied by the `.js [data-reveal]` rule in styles.css,
 * which only matches once the inline bootstrap script has flagged the document
 * as JS-enabled. IntersectionObserver then flips `data-reveal="shown"` once
 * per element. prefers-reduced-motion disables the transform entirely.
 */
export function Reveal({ children, delay = 0, as, className }: Props) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.reveal = "shown";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target); // once per element
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
