import type { Metadata } from "next";
import Link from "next/link";
import { AdminListFilters } from "@/components/admin/ListFilters";
import { AdminPagination } from "@/components/admin/Pager";
import { fetchAdminContacts } from "@/lib/api/admin-server";
import { DeleteRowButton } from "@/components/admin/DeleteBtn";
import { AdminPageHeader } from "@/components/layout/AppPageHeader";
import { deleteContactSubmission } from "../dashboard/actions";

const PAGE_SIZE = 25;

export const metadata: Metadata = {
  title: "Contacts — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminContactsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const res = await fetchAdminContacts({ q, page });
  const total = res.total;
  const rows = (res.contacts || []).map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subtitle = `${total} message${total === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`;

  return (
    <div className="stack-page content-wide">
      <AdminPageHeader title="Contact messages" description={subtitle} />

      <AdminListFilters
        basePath="/admin/contacts"
        placeholder="Name, email, service, message…"
        defaultQuery={q}
      />

      <div className="overflow-x-auto rounded-2xl border border-border-strong">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border-strong bg-surface-elevated/80">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-soft">Date</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Name</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Email</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Service</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Preview</th>
              <th className="px-4 py-3 font-medium text-muted-soft">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {q ? "No contacts match your search." : "No contact submissions yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border transition hover:bg-pill-hover"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-soft">
                    {r.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                    {r.email}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.service}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-soft">
                    {r.message}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/contacts/${r.id}`}
                        className="text-teal hover:underline"
                      >
                        Open / edit
                      </Link>
                      <DeleteRowButton
                        label="Delete"
                        action={deleteContactSubmission.bind(null, r.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/contacts"
        page={page}
        totalPages={totalPages}
        query={{ q: q || undefined }}
      />
    </div>
  );
}
