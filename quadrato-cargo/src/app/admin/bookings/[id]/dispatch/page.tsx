import type { Metadata } from "next";
import { AdminBookingDispatchSplit } from "../../AdminBookingDispatchSplit";
import { getAdminBookingBundle } from "../_lib/get-admin-booking-bundle";
import { BookingSectionIntro } from "../BookingSectionIntro";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Dispatch — ${id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminBookingDispatchPage({ params }: Props) {
  const { id } = await params;
  const b = await getAdminBookingBundle(id);
  const { booking: row, couriers, agencyOptions, trackReference, pickupPin } = b;

  return (
    <div className="space-y-6">
      <BookingSectionIntro step="Operations" title="Dispatch & assignment">
        <p>
          Set <strong className="font-medium text-ink">shipment status</strong>,{" "}
          <strong className="font-medium text-ink">tracking number</strong>, notes customers see on Track, staff-only
          logs, customer-facing dates, estimated delivery, international macro (if applicable), then{" "}
          <strong className="font-medium text-ink">agency and courier</strong>. Each green{" "}
          <strong className="font-medium text-ink">Save</strong> sends the full update.
        </p>
      </BookingSectionIntro>

      <AdminBookingDispatchSplit
        key={`${row.id}-${String(row.customerFacingCreatedAt ?? "")}-${String(row.customerFacingUpdatedAt ?? "")}-${String(row.estimatedDeliveryAt ?? "")}-${String(row.internationalAgencyStage ?? "")}`}
        bookingId={row.id}
        trackReference={trackReference}
        routeType={row.routeType}
        pickupPin={pickupPin}
        assignedAgency={row.assignedAgency ?? null}
        agencyOptions={agencyOptions}
        currentStatus={row.status}
        consignmentNumber={row.consignmentNumber}
        publicTrackingNote={row.publicTrackingNote ?? row.customerTrackingNote ?? null}
        operationalTrackingNotes={row.trackingNotes}
        internalNotes={row.internalNotes}
        couriers={couriers}
        assignedCourierId={row.courierId}
        customerFacingBookedIso={String(
          row.customerFacingCreatedAt ?? row.createdAt.toISOString(),
        )}
        customerFacingUpdatedIso={String(
          row.customerFacingUpdatedAt ??
            (typeof row.updatedAt === "string" ? row.updatedAt : row.createdAt.toISOString()),
        )}
        estimatedDeliveryAtIso={row.estimatedDeliveryAt ?? null}
        internationalAgencyStage={row.internationalAgencyStage ?? null}
      />
    </div>
  );
}
