import type { SVGProps } from "react";

const MARK_PATHS = (
  <>
    <path
      d="m 44.4526,234.8898 v 37.0378 H 82.472 v -37.0378 z"
      fill="#3ed5c2"
      fillRule="evenodd"
    />
    <path
      d="m 44.4532,276.359 v 37.0378 H 82.4726 V 276.359 Z"
      fill="#3ed5c2"
      fillRule="evenodd"
    />
    <path
      d="m 86.5687,276.3147 v 37.0379 h 38.0194 v -37.0379 z"
      fill="#3ed5c2"
      fillRule="evenodd"
    />
    <path
      d="m 86.3844,234.8904 v 37.0378 h 38.0194 v -37.0378 z"
      fill="#ed7304"
      fillRule="evenodd"
    />
  </>
);

const fontStack = "var(--font-outfit), var(--font-manrope), ui-sans-serif, system-ui, sans-serif";

export type QuadratoBrandLogoVariant = "full" | "wordmark" | "mark";

export type QuadratoBrandLogoProps = SVGProps<SVGSVGElement> & {
  variant?: QuadratoBrandLogoVariant;
  /** When false, hide from assistive tech (e.g. parent link has aria-label). */
  decorative?: boolean;
};

/**
 * Brand lockup from `1.svg`: grid mark + wordmark (+ optional tagline).
 * Wordmark uses `currentColor` for light/dark themes.
 */
export function QuadratoBrandLogo({
  variant = "full",
  className,
  decorative = true,
  "aria-label": ariaLabel = "Quadrato Cargo",
  ...rest
}: QuadratoBrandLogoProps) {
  const vb =
    variant === "mark"
      ? "42 232 84 82"
      : "40 224 378 96";

  return (
    <svg
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : ariaLabel}
      {...rest}
    >
      <g>{MARK_PATHS}</g>
      {variant !== "mark" ? (
        <>
          <text
            x={131}
            y={279.24719}
            style={{ fontFamily: fontStack }}
            fontSize={28}
            fontWeight={700}
            fill="currentColor"
          >
            Quadrato Cargo
          </text>
          {variant === "full" ? (
            <text
              x={171.5468}
              y={294.16479}
              style={{ fontFamily: fontStack }}
              fontSize={13}
              fontWeight={600}
              fill="#ee5f10"
            >
              Fast Forward Rapid Reach
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
