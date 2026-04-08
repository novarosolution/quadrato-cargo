import type { AdminBookingCourierOption } from "../AdminBookingDispatchSplit";
import { getAdminBookingBundle } from "./_lib/get-admin-booking-bundle";
import { AdminBookingCourierSidebar } from "./AdminBookingCourierSidebar";
import { AdminBookingLayoutHeader } from "./AdminBookingLayoutHeader";
import { AdminBookingSubNav } from "./AdminBookingSubNav";

export default async function AdminBookingIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getAdminBookingBundle(id);
  const { booking } = bundle;

  const courierOptions: AdminBookingCourierOption[] = bundle.couriers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    isActive: c.isActive,
    isOnDuty: c.isOnDuty,
    readyForJob: c.readyForJob,
    courierActiveJobCount: c.courierActiveJobCount,
  }));

  return (
    <div className="stack-page content-wide gap-6 pb-16 sm:gap-8">
      <AdminBookingLayoutHeader booking={booking} />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="shrink-0 lg:sticky lg:top-6 lg:w-72">
          <AdminBookingCourierSidebar
            bookingId={id}
            couriers={courierOptions}
            assignedCourierId={booking.courierId}
            assignedCourier={
              booking.courier
                ? { name: booking.courier.name, email: booking.courier.email }
                : null
            }
          />
          <AdminBookingSubNav bookingId={id} />
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl border border-border-strong/60 bg-linear-to-b from-surface-elevated/45 via-surface-elevated/28 to-surface-elevated/15 p-5 shadow-[0_12px_48px_-28px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.05] backdrop-blur-md sm:p-7 dark:from-surface-elevated/35 dark:via-surface-elevated/22 dark:to-surface-elevated/12 dark:shadow-black/45 dark:ring-white/[0.04]">
          {children}
        </main>
      </div>
    </div>
  );
}
