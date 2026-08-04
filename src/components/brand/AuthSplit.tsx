import type { ReactNode } from "react";

type Props = {
  /** Form column content. */
  children: ReactNode;
  /** Optional brand mark / wordmark rendered above the form. */
  brand?: ReactNode;
  /** Photography for the right column; column is omitted when absent. */
  imageUrl: string | null;
  imageAlt: string;
};

/**
 * Two-column authentication shell: form on the warm paper background at the
 * left, full-height photography at the right. The image column is hidden on
 * mobile so only the centred form remains.
 */
export function AuthSplit({ children, brand, imageUrl, imageAlt }: Props) {
  return (
    <div className="min-h-screen bg-background p-3 sm:p-5 lg:p-6">
      <div className="grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex items-center justify-center px-3 py-10 sm:px-8">
          <div className="w-full max-w-[26rem]">
            {brand ? <div className="mb-12">{brand}</div> : null}
            {children}
          </div>
        </div>

        {imageUrl ? (
          <div className="hidden overflow-hidden rounded-media bg-muted lg:block">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
