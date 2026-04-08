import type { ReactNode } from "react";
import Link from "next/link";
import { PublicCard } from "@/components/public/PublicCard";
import { PublicPageSection } from "@/components/public/PublicPageSection";
import { PublicPageHeader } from "@/components/layout/AppPageHeader";
import { Container } from "@/components/Wrap";
import { publicClass, publicUi } from "@/components/public/public-ui";

/**
 * Shared shell for customer **Log in** and **Register** — same hero, card, and footer link.
 */
export function CustomerAuthLayout({
  eyebrow = "Account",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={publicUi.page}>
      <section
        className={publicClass(
          publicUi.authHeroSection,
          "relative overflow-hidden bg-linear-to-b from-teal/[0.07] via-canvas/40 to-transparent",
        )}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-teal/10 blur-3xl"
          aria-hidden
        />
        <Container className={`relative ${publicUi.narrowContainer}`}>
          <PublicPageHeader eyebrow={eyebrow} title={title} description={description} />
        </Container>
      </section>

      <PublicPageSection className="pt-8! sm:pt-10!">
        <Container className={publicUi.narrowContainer}>
          <PublicCard className="shadow-2xl shadow-black/35 sm:p-8">{children}</PublicCard>
          <p className={publicUi.authFooterNote}>
            <Link href="/public" className={publicUi.linkQuiet}>
              Back to home
            </Link>
          </p>
        </Container>
      </PublicPageSection>
    </div>
  );
}
