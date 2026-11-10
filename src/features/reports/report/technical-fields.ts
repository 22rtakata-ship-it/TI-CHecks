import type { Activity } from "@/types/domain";
import { activityDescription } from "@/features/activities/description";

export function reportValue(value: string | undefined) {
  return value?.trim() || "N/A";
}

export function technicalActivityFields(activity: Activity) {
  return [
    ["Título", reportValue(activity.title)],
    ["Setor", reportValue(activity.sector)],
    ["Categoria", reportValue(activity.category)],
    ["Chamado", reportValue(activity.ticket)],
    ["Status", reportValue(activity.status)],
    ["Descrição", reportValue(activityDescription(activity))],
  ] as const;
}
