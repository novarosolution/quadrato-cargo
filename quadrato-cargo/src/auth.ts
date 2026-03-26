import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api/base-url";

const disabledResponse = new Response("Auth API disabled in frontend-only mode.", {
  status: 404,
});

export type SessionLike = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
};

export const handlers = {
  GET: async () => disabledResponse,
  POST: async () => disabledResponse,
};

export async function signIn(): Promise<void> {
  return;
}

export async function signOut(): Promise<void> {
  return;
}

export async function auth(): Promise<SessionLike | null> {
  try {
    const cookieHeader = (await cookies()).toString();
    if (!cookieHeader) return null;

    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      ok?: boolean;
      user?: {
        id?: string;
        email?: string | null;
        name?: string | null;
        role?: string | null;
      } | null;
    };
    if (!data?.ok || !data.user?.id) return null;
    return { user: data.user };
  } catch {
    return null;
  }
}
