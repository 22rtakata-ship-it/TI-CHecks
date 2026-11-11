import type { Status } from "@/types/shared";
import { statusClassName } from "./statusPresentation";

export function TechnicalStatusBadge({
  status,
}: {
  status: Status | "Removida";
}) {
  return (
    <span
      className={`badge technical-status-badge ${status === "Removida" ? "status-removed" : statusClassName(status)}`}
    >
      {status}
    </span>
  );
}
