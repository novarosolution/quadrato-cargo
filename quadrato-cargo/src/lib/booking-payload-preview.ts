export type PayloadParcelRow = {
  index: number;
  contents: string;
  weightKg?: number;
  declaredValue?: string;
  dimensionsLabel?: string;
};

export type PayloadPreview = {
  collectionMode?: string;
  pickupPreference?: string;
  instructions?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderStreet?: string;
  senderCity?: string;
  senderPostal?: string;
  senderCountry?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientStreet?: string;
  recipientCity?: string;
  recipientPostal?: string;
  recipientCountry?: string;
  contents?: string;
  weightKg?: number;
  declaredValue?: string;
  dimensionsCm?: { l?: string; w?: string; h?: string };
  /** When shipment.parcels exists — one row per physical parcel. */
  parcelRows?: PayloadParcelRow[];
};

export function payloadPreview(payload: unknown): PayloadPreview {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;
  const sender = p.sender as Record<string, unknown> | undefined;
  const recipient = p.recipient as Record<string, unknown> | undefined;
  const shipment = p.shipment as Record<string, unknown> | undefined;
  const rawParcels = shipment?.parcels;
  let parcelRows: PayloadParcelRow[] | undefined;
  if (Array.isArray(rawParcels) && rawParcels.length > 0) {
    parcelRows = rawParcels.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        return { index: index + 1, contents: "" };
      }
      const row = raw as Record<string, unknown>;
      const d =
        row.dimensionsCm && typeof row.dimensionsCm === "object"
          ? (row.dimensionsCm as Record<string, unknown>)
          : {};
      const l = typeof d.l === "string" ? d.l.trim() : "";
      const w = typeof d.w === "string" ? d.w.trim() : "";
      const h = typeof d.h === "string" ? d.h.trim() : "";
      const dims = l && w && h ? `${l} × ${w} × ${h} cm` : undefined;
      const wk = row.weightKg;
      let weightNum: number | undefined;
      if (typeof wk === "number" && Number.isFinite(wk)) weightNum = wk;
      else if (typeof wk === "string" && wk.trim()) {
        const p = Number.parseFloat(wk.replace(",", "."));
        if (Number.isFinite(p)) weightNum = p;
      }
      return {
        index: index + 1,
        contents:
          typeof row.contentsDescription === "string" ? row.contentsDescription : "",
        weightKg: weightNum,
        declaredValue:
          typeof row.declaredValue === "string" ? row.declaredValue : undefined,
        dimensionsLabel: dims,
      };
    });
  }
  return {
    collectionMode:
      typeof p.collectionMode === "string" ? p.collectionMode : undefined,
    pickupPreference:
      typeof p.pickupPreference === "string" ? p.pickupPreference : undefined,
    instructions: typeof p.instructions === "string" ? p.instructions : undefined,
    senderName: typeof sender?.name === "string" ? sender.name : undefined,
    senderEmail: typeof sender?.email === "string" ? sender.email : undefined,
    senderPhone: typeof sender?.phone === "string" ? sender.phone : undefined,
    senderStreet: typeof sender?.street === "string" ? sender.street : undefined,
    senderCity: typeof sender?.city === "string" ? sender.city : undefined,
    senderPostal: typeof sender?.postal === "string" ? sender.postal : undefined,
    senderCountry: typeof sender?.country === "string" ? sender.country : undefined,
    recipientName:
      typeof recipient?.name === "string" ? recipient.name : undefined,
    recipientEmail:
      typeof recipient?.email === "string" ? recipient.email : undefined,
    recipientPhone:
      typeof recipient?.phone === "string" ? recipient.phone : undefined,
    recipientStreet:
      typeof recipient?.street === "string" ? recipient.street : undefined,
    recipientCity: typeof recipient?.city === "string" ? recipient.city : undefined,
    recipientPostal:
      typeof recipient?.postal === "string" ? recipient.postal : undefined,
    recipientCountry:
      typeof recipient?.country === "string" ? recipient.country : undefined,
    contents:
      typeof shipment?.contentsDescription === "string"
        ? shipment.contentsDescription
        : undefined,
    weightKg: typeof shipment?.weightKg === "number" ? shipment.weightKg : undefined,
    declaredValue:
      typeof shipment?.declaredValue === "string"
        ? shipment.declaredValue
        : undefined,
    dimensionsCm:
      shipment?.dimensionsCm && typeof shipment.dimensionsCm === "object"
        ? (shipment.dimensionsCm as { l?: string; w?: string; h?: string })
        : undefined,
    parcelRows,
  };
}
