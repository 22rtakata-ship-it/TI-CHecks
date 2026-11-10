import type { ValidityRecord } from "@/features/validity/types";
import type { Activity } from "@/features/activities/types";
import type { IncidentEvent, Incident } from "@/features/incidents/types";
import type {
  ChecklistTemplate,
  ChecklistExecution,
} from "@/features/checklists/types";
import type { Evidence } from "@/features/evidence/types";
export type * from "./shared";
export type * from "@/features/validity/types";
export type * from "@/features/activities/types";
export type * from "@/features/incidents/types";
export type * from "@/features/checklists/types";
export type * from "@/features/evidence/types";
export interface AppData {
  version: 1;
  validityRecords: ValidityRecord[];
  activities: Activity[];
  incidents: Incident[];
  templates: ChecklistTemplate[];
  executions: ChecklistExecution[];
  evidence: Evidence[];
  categories: string[];
}
