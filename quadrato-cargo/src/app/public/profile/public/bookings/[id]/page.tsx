import { redirect } from "next/navigation";

type LegacyProfileBookingDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyProfileBookingDetailPage({
  params
}: LegacyProfileBookingDetailProps) {
  const { id } = await params;
  redirect(`/public/profile/booksdetels/${id}`);
}
