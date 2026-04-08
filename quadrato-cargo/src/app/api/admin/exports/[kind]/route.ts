import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiUpstreamBaseUrl } from "@/lib/api/base-url";
import { ADMIN_API_SECRET } from "@/lib/admin-api-secret";

const KINDS = new Set(["users", "contacts", "bookings"]);

const FILENAMES: Record<string, string> = {
  users: "quadrato-users.csv",
  contacts: "quadrato-contacts.csv",
  bookings: "quadrato-bookings.csv",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind } = await context.params;
  if (!KINDS.has(kind)) {
    return NextResponse.json({ ok: false, message: "Unknown export type." }, { status: 404 });
  }

  const store = await cookies();
  const cookieHeader = store.toString();
  const base = getApiUpstreamBaseUrl();

  const me = await fetch(`${base}/api/admin/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  if (!me.ok) {
    return NextResponse.json(
      { ok: false, message: "Sign in to the admin panel first, then try the export again." },
      { status: 401 },
    );
  }
  const meJson = (await me.json().catch(() => ({}))) as { ok?: boolean; admin?: unknown };
  if (!meJson.ok || !meJson.admin) {
    return NextResponse.json(
      { ok: false, message: "Admin session expired. Sign in again." },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${base}/api/admin/export/${kind}`, {
    method: "GET",
    cache: "no-store",
    headers: { "x-admin-secret": ADMIN_API_SECRET },
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { ok: false, message: text || `Export failed (${upstream.status}).` },
      { status: upstream.status >= 400 ? upstream.status : 502 },
    );
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${FILENAMES[kind]}"`,
    },
  });
}
