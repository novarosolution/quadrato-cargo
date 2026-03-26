import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/base-url";

/** True if cookie is valid for env-based admin session. */
export async function isAdminSessionValid(): Promise<boolean> {
  const store = await cookies();
  const cookieHeader = store.toString();
  if (!cookieHeader) return false;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/admin/auth/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean; admin?: { email?: string } | null };
    return Boolean(data.ok && data.admin?.email);
  } catch {
    return false;
  }
}

export async function assertAdmin(): Promise<void> {
  const ok = await isAdminSessionValid();
  if (!ok) {
    redirect("/admin/login");
  }
}
