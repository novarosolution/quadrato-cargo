import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  /** Wider max width for hero / key layouts */
  wide?: boolean;
};

export function Container({ children, className = "", wide = false }: ContainerProps) {
  // Centralizing max-width logic prevents subtle layout mismatch between pages.
  const max = wide ? "max-w-7xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${max} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
