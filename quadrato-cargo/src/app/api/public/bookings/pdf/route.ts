import { NextResponse } from "next/server";
import { getApiUpstreamBaseUrl } from "@/lib/api/base-url";

/**
 * Production: browser calls same-origin `/api/public/bookings/pdf` (see DownloadBookingPdfButton).
 * Without this route, Next returns 404 and the client used to fall back to a simplified jsPDF invoice.
 * This handler proxies to Express with the user's cookies and CSRF header.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const csrf =
    request.headers.get("X-CSRF-Token") ?? request.headers.get("x-csrf-token") ?? "";

  const base = getApiUpstreamBaseUrl();
  const upstream = await fetch(`${base}/api/public/bookings/pdf`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body,
  });

  const ct = upstream.headers.get("content-type") || "";
  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": ct.includes("json") ? ct : "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  const cd = upstream.headers.get("Content-Disposition");
  const qcTemplate = upstream.headers.get("X-QC-Invoice-Template");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      ...(cd ? { "Content-Disposition": cd } : {}),
      ...(qcTemplate ? { "X-QC-Invoice-Template": qcTemplate } : {}),
    },
  });
}
