import type { SVGProps } from "react";

/** 2×2 grid mark — square tiles. */
const MARK_TILES = (
  <g>
    <rect x="44.45" y="234.89" width="38.02" height="37.04" fill="#3ed5c2" />
    <rect x="44.45" y="276.36" width="38.02" height="37.04" fill="#3ed5c2" />
    <rect x="86.38" y="234.89" width="38.02" height="37.04" fill="#ed7304" />
    <rect x="86.57" y="276.31" width="38.02" height="37.05" fill="#3ed5c2" />
  </g>
);

const fontStack = "var(--font-outfit), var(--font-manrope), ui-sans-serif, system-ui, sans-serif";

export type QuadratoBrandLogoVariant = "full" | "wordmark" | "mark";

type MarkLogoProps = {
  variant: "mark";
  className?: string;
  decorative?: boolean;
  "aria-label"?: string;
} & Pick<SVGProps<SVGSVGElement>, "style" | "id" | "onClick">;

type LockupLogoProps = {
  variant?: "full" | "wordmark";
  className?: string;
  decorative?: boolean;
  "aria-label"?: string;
};

export type QuadratoBrandLogoProps = MarkLogoProps | LockupLogoProps;

/**
 * Brand lockup: square grid mark + SVG wordmark (`--logo-wordmark-fill` for contrast on dark/light bars).
 */
export function QuadratoBrandLogo(props: QuadratoBrandLogoProps) {
  if (props.variant === "mark") {
    const { className, decorative = true, "aria-label": ariaLabel = "Quadrato Cargo", style, id, onClick } =
      props;
    return (
      <svg
        viewBox="42 232 84 82"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        id={id}
        onClick={onClick}
        role={decorative ? "presentation" : "img"}
        aria-hidden={decorative}
        aria-label={decorative ? undefined : ariaLabel}
      >
        {MARK_TILES}
      </svg>
    );
  }

  const {
    variant = "full",
    className = "",
    decorative = true,
    "aria-label": ariaLabel = "Quadrato Cargo",
  } = props;

  const vb = "40 224 378 96";
  const lineOnly = variant === "wordmark";

  return (
    <svg
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : ariaLabel}
    >
      {MARK_TILES}
      <text
        x={131}
        y={279.24719}
        style={{ fontFamily: fontStack }}
        fontSize={28}
        fontWeight={700}
        fill="var(--logo-wordmark-fill, currentColor)"
      >
        Quadrato Cargo
      </text>
      {!lineOnly ? (
        <text
          x={171.5468}
          y={294.16479}
          style={{ fontFamily: fontStack }}
          fontSize={13}
          fontWeight={600}
          fill="var(--color-accent-hover)"
        >
          Fast Forward Rapid Reach
        </text>
      ) : null}
    </svg>
  );
}
