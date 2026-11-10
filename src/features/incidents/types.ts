import type { Status, ChecklistStatus } from "@/types/shared";
export interface IncidentEvent {
  id: string;
  date: string;
  at: string;
  text: string;
  status: Status;
  activityId?: string;
}
export interface Incident {
  id: string;
  title: string;
  store: string;
  openedOn: string;
  status: Status;
  ticket: string;
  events: IncidentEvent[];
  deletedAt?: string;
}
