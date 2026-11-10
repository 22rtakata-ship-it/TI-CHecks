import type { AppData } from "@/types/domain";
import { planned } from "@/features/checklists/service";
import { checklistMetrics } from "@/features/checklists/metrics";
import { visibleActivities } from "@/features/activities/visibility";
import { shiftDate, today } from "@/lib/date";
import { statusOn, resolutionDate } from "@/features/incidents/service";
import { monthEnd } from "./calendar";

export function monthlyReport(
  data: AppData,
  month: string,
  store: string,
  category = "",
) {
  const start = `${month}-01`;
  const end = monthEnd(month);
  const activities = visibleActivities(data).filter(
    (a) =>
      a.date.startsWith(month) &&
      a.store === store &&
      (!category || a.category === category),
  );
  const incidents = data.incidents.filter(
    (i) => !i.deletedAt && i.store === store && i.openedOn <= end,
  );
  const resolved = incidents.filter((i) => {
    const resolvedOn = resolutionDate(i, end);
    return !!resolvedOn && resolvedOn >= start;
  });
  const pending = incidents.filter((i) => statusOn(i, end) !== "Concluído");
  const checklists = [];
  for (let date = start; date <= end; date = shiftDate(date, 1))
    checklists.push(...planned(data.templates, data.executions, date, store));
  const checklistTotals = checklistMetrics(checklists);
  return {
    activities,
    resolved,
    pending,
    checklists,
    completed: checklistTotals.completed,
    applicable: checklistTotals.applicable,
    notApplicable: checklistTotals.notApplicable,
    minutes: activities.reduce((n, a) => n + (a.minutes || 0), 0),
    execution: checklistTotals.percentage,
  };
}

/** Dashboard progress excludes future routines from the execution denominator. */
export function dashboardMetrics(
  data: AppData,
  month: string,
  store: string,
  referenceDate = today(),
) {
  const report = monthlyReport(data, month, store);
  const cutoff =
    month < referenceDate.slice(0, 7) ? monthEnd(month) : referenceDate;
  const dueChecklists = report.checklists.filter((c) => c.date <= cutoff);
  const futureChecklists = report.checklists.filter((c) => c.date > cutoff);
  const dueTotals = checklistMetrics(dueChecklists);
  const incidents = data.incidents.filter(
    (i) => !i.deletedAt && i.store === store && i.openedOn <= cutoff,
  );
  const pending = incidents.filter((i) => statusOn(i, cutoff) !== "Concluído");
  const resolved = incidents.filter((i) => {
    const date = resolutionDate(i, cutoff);
    return !!date && date >= `${month}-01`;
  });
  const categoryCounts = new Map<string, number>();
  for (const activity of report.activities)
    categoryCounts.set(
      activity.category,
      (categoryCounts.get(activity.category) || 0) + 1,
    );
  return {
    report,
    cutoff,
    dueChecklists,
    futureChecklists,
    completed: dueTotals.completed,
    applicable: dueTotals.applicable,
    notApplicable: dueTotals.notApplicable,
    checklistPercent: dueTotals.percentage,
    pending,
    resolved,
    waiting: pending.filter(
      (i) => statusOn(i, cutoff) === "Aguardando terceiros",
    ),
    categories: [...categoryCounts].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"),
    ),
  };
}
