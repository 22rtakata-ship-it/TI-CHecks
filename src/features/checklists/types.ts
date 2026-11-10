import type { Status, ChecklistStatus } from "@/types/shared";
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  active: boolean;
  recurring: boolean;
  weekdays: number[];
  date: string;
  start: string;
  end: string;
  history?: { until: string; schedule: Omit<ChecklistTemplate, "history"> }[];
}
export interface ChecklistExecution {
  id: string;
  templateId: string;
  name: string;
  date: string;
  store: string;
  status: Exclude<ChecklistStatus, "A fazer">;
  reason: string;
  notes: string;
}
