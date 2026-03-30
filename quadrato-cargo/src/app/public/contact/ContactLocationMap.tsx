import {
  contactPageMapIframeSrc,
  googleMapsPlaceSearchUrl,
} from "@/lib/contact-google-map";

type Props = {
  officeAddress: string;
  googleMapsEmbedSrc: string;
};

export function ContactLocationMap({ officeAddress, googleMapsEmbedSrc }: Props) {
  const iframeSrc = contactPageMapIframeSrc(officeAddress, googleMapsEmbedSrc);
  const openHref = googleMapsPlaceSearchUrl(officeAddress);

  if (!iframeSrc && !openHref) return null;

  return (
    <section
      className="mt-10 overflow-hidden rounded-2xl border border-border-strong bg-surface-elevated/40 shadow-lg shadow-black/10"
      aria-label="Office location map"
    >
      {iframeSrc ? (
        <div className="relative aspect-16/10 w-full min-h-[220px] bg-canvas/50">
          <iframe
            title="Google Map — office location"
            src={iframeSrc}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
      {iframeSrc || openHref ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-strong bg-canvas/30 px-4 py-3 text-sm">
          <span className="text-xs text-muted-soft">Google Maps</span>
          {openHref ? (
            <a
              href={openHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-teal underline-offset-2 hover:underline"
            >
              Open in Google Maps
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
