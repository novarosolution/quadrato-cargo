"use client";

import { authFieldClass } from "@/components/auth/authStyles";
import { getRegionOptionsForCountry } from "@/lib/country-state-options";

type Props = {
  id: string;
  name: string;
  country: string;
  value: string;
  onChange: (next: string) => void;
  errorMsg?: string;
  autoComplete?: string;
  /** Override default `authFieldClass` (e.g. profile spacing utilities). */
  className?: string;
};

/** State/province: dropdown when we have regions for the selected country; otherwise text. */
export function RegionFieldByCountry({
  id,
  name,
  country,
  value,
  onChange,
  errorMsg,
  autoComplete,
  className,
}: Props) {
  const fieldClass = className ?? authFieldClass;
  const opts = getRegionOptionsForCountry(country);
  if (opts?.length) {
    const extended =
      value.trim() && !opts.includes(value) ? [...opts, value] : [...opts];
    return (
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
        aria-invalid={Boolean(errorMsg)}
        aria-describedby={errorMsg ? `${id}-err` : undefined}
        autoComplete={autoComplete}
      >
        <option value="">Select state / province</option>
        {extended.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={120}
      placeholder="State / province (if applicable)"
      className={fieldClass}
      autoComplete={autoComplete}
      aria-invalid={Boolean(errorMsg)}
      aria-describedby={errorMsg ? `${id}-err` : undefined}
    />
  );
}
