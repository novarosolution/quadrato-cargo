export type { QuadratoBrandLogoProps, QuadratoBrandLogoVariant } from "./QuadratoBrandLogo";
export { QuadratoBrandLogo } from "./QuadratoBrandLogo";

import { QuadratoBrandLogo } from "./QuadratoBrandLogo";

type LogoMarkProps = {
  className?: string;
  /** Kept for API compatibility; brand mark has no pulse animation. */
  ambientPulse?: boolean;
};

/** Compact grid mark only (header favicon-sized slots, etc.). */
export function LogoMark({ className }: LogoMarkProps) {
  return <QuadratoBrandLogo variant="mark" className={className} decorative />;
}
