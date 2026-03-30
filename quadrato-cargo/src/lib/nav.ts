export type NavItem = { href: string; label: string };

export const mainNav: NavItem[] = [
  { href: "/public", label: "Home" },
  { href: "/public/service", label: "Services" },
  { href: "/public/book", label: "Book Courier" },
  { href: "/public/tsking", label: "Track Order" },
  { href: "/public/howwork", label: "How It Works" },
  { href: "/public/price", label: "Pricing" },
  { href: "/public/about", label: "About Us" },
  { href: "/public/contact", label: "Contact" },
];

/** Shown in header (aside from main nav) and footer account section */
export const authNav: NavItem[] = [
  { href: "/public/register", label: "Register" },
  { href: "/public/login", label: "Log in" },
];
