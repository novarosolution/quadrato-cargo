import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "qc_admin_auth";
const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_PUBLIC_PREFIX = "/admin/public";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === ADMIN_LOGIN_PATH || pathname.startsWith(ADMIN_PUBLIC_PREFIX)) {
    return NextResponse.next();
  }

  const hasAdminCookie = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
  if (hasAdminCookie) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = ADMIN_LOGIN_PATH;
  const callback = `${pathname}${search || ""}`;
  loginUrl.searchParams.set("callbackUrl", callback);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
