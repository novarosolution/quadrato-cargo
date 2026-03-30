import { getApiBaseUrl } from "@/lib/api/base-url";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type RegisterBody = {
  name?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterFormResult =
  | { ok: true; message: string; user: ApiUser }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<
        Record<"name" | "email" | "password" | "confirmPassword", string>
      >;
    };

export type LoginFormResult =
  | { ok: true; message: string; user: ApiUser }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<Record<"email" | "password", string>>;
    };

export async function postRegisterApi(
  body: RegisterBody,
): Promise<RegisterFormResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      user?: ApiUser;
      fieldErrors?: Partial<
        Record<"name" | "email" | "password" | "confirmPassword", string>
      >;
    };
    if (res.ok && data.ok && data.user) {
      return {
        ok: true,
        message: data.message || "Account created successfully.",
        user: data.user,
      };
    }
    return {
      ok: false,
      message: data.message || "Registration failed.",
      fieldErrors: data.fieldErrors || {},
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
      fieldErrors: {},
    };
  }
}

export async function postLoginApi(body: LoginBody): Promise<LoginFormResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      user?: ApiUser;
      fieldErrors?: Partial<Record<"email" | "password", string>>;
    };
    if (res.ok && data.ok && data.user) {
      return {
        ok: true,
        message: data.message || "Logged in successfully.",
        user: data.user,
      };
    }
    return {
      ok: false,
      message: data.message || "Login failed.",
      fieldErrors: data.fieldErrors || {},
    };
  } catch {
    return {
      ok: false,
      message: "Cannot connect to server. Start backend and try again.",
      fieldErrors: {},
    };
  }
}

export async function postLogoutApi(): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return;
  }
}

/** Client-side session probe (e.g. footer); uses the same cookie as server `auth()`. */
export async function fetchAuthMeClient(): Promise<ApiUser | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: ApiUser | null;
    };
    if (!data?.ok || !data.user?.id) return null;
    return data.user;
  } catch {
    return null;
  }
}
