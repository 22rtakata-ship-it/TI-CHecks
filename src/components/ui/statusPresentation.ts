import type { Status } from "@/types/shared";

const classes: Record<Status, string> = {
  Pendente: "status-pending",
  Concluído: "status-completed",
  "Em andamento": "status-progress",
  "Aguardando terceiros": "status-waiting",
};

export function statusClassName(status: Status) {
  return classes[status];
}
