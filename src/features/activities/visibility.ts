import type { Activity, AppData } from "@/types/domain";

/** Keep archived records for restoration; omit activities tied to removed incidents from normal views. */
export function visibleActivities(
  data: Pick<AppData, "activities" | "incidents">,
): Activity[] {
  const removed = new Set(
    data.incidents
      .filter((incident) => incident.deletedAt)
      .map((incident) => incident.id),
  );
  return data.activities.filter(
    (activity) =>
      !activity.deletedAt &&
      (!activity.incidentId || !removed.has(activity.incidentId)),
  );
}
