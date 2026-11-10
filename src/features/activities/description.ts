import type { Activity } from "./types";

/** Keeps descriptions readable for records created before the simplified form. */
export function activityDescription(activity: Activity): string {
  if (activity.description !== undefined) return activity.description;
  return [
    ["Problema ou solicitação", activity.problem],
    ["Procedimentos realizados", activity.procedure],
    ["Resultado obtido", activity.result],
    ["Observações", activity.notes],
  ]
    .filter(([, value]) => value?.trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n\n");
}
