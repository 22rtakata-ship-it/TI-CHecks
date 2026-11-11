import type { Status, ChecklistStatus } from "@/types/shared";
export interface Activity {
  id: string;
  date: string;
  createdAt: string;
  store: string;
  title: string;
  titlePresetId?: string;
  titlePrefix?: string;
  titleDetail?: string;
  description?: string;
  sector: string;
  category: string;
  equipment: string;
  problem: string;
  procedure: string;
  result: string;
  minutes?: number;
  notes: string;
  status: Status;
  ticket: string;
  nextAction: string;
  dependency: string;
  followUp: string;
  incidentId?: string;
  checklistId?: string;
  deletedAt?: string;
  revisions: { at: string; title: string; status: Status }[];
}
