import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminContactDetail } from "@/lib/api/admin-server";
import { AdminContactEditForm } from "../editcon";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { deleteContactSubmission } from "../../dashboard/actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Contact ${id.slice(0, 8)}… — Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminContactDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await fetchAdminContactDetail(id);
  const row = res.contact
    ? { ...res.contact, createdAt: new Date(res.contact.createdAt) }
    : null;
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/contacts"
        className="text-sm text-teal hover:underline"
      >
        ← All contacts
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-2xl font-semibold">{row.name}</h1>
          <p className="mt-1 text-sm text-muted-soft">
            {row.createdAt.toLocaleString()}
          </p>
        </div>
        <DeleteRowButton
          label="Delete message"
          action={deleteContactSubmission.bind(null, row.id)}
          redirectAfter="/admin/contacts"
        />
      </div>

      <section className="rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <h2 className="font-display text-lg font-semibold">Edit record</h2>
        <p className="mt-1 text-xs text-muted-soft">
          Update stored fields for this contact submission.
        </p>
        <div className="mt-6">
          <AdminContactEditForm
            contactId={row.id}
            initial={{
              name: row.name,
              email: row.email,
              phone: row.phone,
              service: row.service,
              message: row.message,
            }}
          />
        </div>
      </section>

      <dl className="space-y-4 rounded-2xl border border-border-strong bg-surface-elevated/50 p-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Email
          </dt>
          <dd className="mt-1">
            <a href={`mailto:${row.email}`} className="text-teal hover:underline">
              {row.email}
            </a>
          </dd>
        </div>
        {row.phone ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Phone
            </dt>
            <dd className="mt-1 text-ink">{row.phone}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Service interest
          </dt>
          <dd className="mt-1 text-ink">{row.service}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
            Message
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {row.message}
          </dd>
        </div>
      </dl>
    </div>
  );
}
