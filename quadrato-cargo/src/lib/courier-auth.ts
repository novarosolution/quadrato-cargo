import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeUserRole } from "@/lib/user-role";

/** Must be signed in as a user with role courier. */
export async function assertCourier(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/public/login?callbackUrl=/courier");
  }
  const role = normalizeUserRole(session?.user?.role ?? null);
  if (role === "staff") {
    redirect("/admin/dashboard");
  }
  if (role !== "courier") {
    redirect("/public/profile");
  }
  return { id: userId, email: String(session?.user?.email ?? "") };
}
