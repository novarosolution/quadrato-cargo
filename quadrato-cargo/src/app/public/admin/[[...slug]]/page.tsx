import { redirect } from "next/navigation";

type LegacyPublicAdminPageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function LegacyPublicAdminPage({
  params
}: LegacyPublicAdminPageProps) {
  const resolved = await params;
  const slugParts = resolved.slug ?? [];
  const nextPath = slugParts.length > 0 ? `/admin/${slugParts.join("/")}` : "/admin/login";
  redirect(nextPath);
}
