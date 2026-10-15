import { Badge } from "@/components/ui/badge";
import { PROPERTY_STATUS_LABELS, operationTypeLabel } from "@/lib/constants";

const BADGE = "text-[11px] font-semibold uppercase tracking-[0.08em] shadow-md px-2.5";

export function isClosedStatus(status: string) {
  return status === "vendida" || status === "alquilada";
}

// Top-left badges shared by the grid card and the listing row: operation,
// "Destacada" and the status (Reservada / Vendida / Alquilada) when not available.
export function CardBadges({
  operationType,
  featured,
  status,
}: {
  operationType: string;
  featured: boolean;
  status: string;
}) {
  const statusLabel =
    status !== "disponible" ? PROPERTY_STATUS_LABELS[status] ?? status : null;

  return (
    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
      <Badge className={`bg-white text-ink ${BADGE}`}>{operationTypeLabel(operationType)}</Badge>
      {featured && <Badge className={`bg-[#ED1B24] text-white ${BADGE}`}>Destacada</Badge>}
      {statusLabel && <Badge className={`bg-ink text-white ${BADGE}`}>{statusLabel}</Badge>}
    </div>
  );
}
