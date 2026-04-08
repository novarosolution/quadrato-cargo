import { Container } from "@/components/Wrap";
import { publicUi } from "@/components/public/public-ui";

function Sk({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-pill ${className}`}
      aria-hidden
    />
  );
}

export default function PublicRouteLoading() {
  return (
    <div
      className={`${publicUi.page} min-h-[45vh]`}
      aria-busy="true"
      aria-live="polite"
    >
      <section className="home-hero-surface border-b border-border bg-linear-to-b from-teal/[0.06] via-canvas to-canvas py-10 sm:py-14">
        <Container className={`relative ${publicUi.narrowContainer}`}>
          <Sk className="mb-4 h-3 w-24 opacity-90" />
          <Sk className="mb-3 h-9 w-full max-w-md sm:h-10" />
          <Sk className="h-4 w-full max-w-xl" />
        </Container>
      </section>
      <div className="py-10 sm:py-12">
        <Container className="content-narrow">
          <Sk className="h-72 w-full rounded-3xl border border-border-strong/50 bg-surface-elevated/30 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] sm:h-80" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Sk className="h-11 w-32 rounded-full" />
            <Sk className="h-11 w-28 rounded-full" />
          </div>
        </Container>
      </div>
    </div>
  );
}
