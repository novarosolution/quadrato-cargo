import { redirect } from "next/navigation";

type LegacyAdminPublicPageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function LegacyAdminPublicPage({
  params
}: LegacyAdminPublicPageProps) {
  const resolved = await params;
  const slugParts = resolved.slug ?? [];
  const nextPath = slugParts.length > 0 ? `/admin/${slugParts.join("/")}` : "/admin/login";
  redirect(nextPath);
}
