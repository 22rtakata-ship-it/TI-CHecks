import type { Status, ChecklistStatus } from "@/types/shared";
export interface Evidence {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  kind: "Antes" | "Depois" | "Documento";
  activityId?: string;
  incidentId?: string;
}
