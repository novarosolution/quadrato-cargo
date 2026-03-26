import { NextResponse } from "next/server";
import { isAdminSessionValid } from "@/lib/admin-auth";

/** For route handlers: return 401 response if not signed in as admin. */
export async function unauthorizedAdminResponse(): Promise<NextResponse | null> {
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
