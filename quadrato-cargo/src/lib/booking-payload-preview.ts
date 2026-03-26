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
};

export function payloadPreview(payload: unknown): PayloadPreview {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as Record<string, unknown>;
  const sender = p.sender as Record<string, unknown> | undefined;
  const recipient = p.recipient as Record<string, unknown> | undefined;
  const shipment = p.shipment as Record<string, unknown> | undefined;
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
  };
}
