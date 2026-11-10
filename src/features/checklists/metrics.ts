import type { ChecklistStatus } from "@/types/shared";

/** NA remains visible in the distribution, but never reduces execution. */
export function checklistMetrics(rows: readonly { status: ChecklistStatus }[]) {
  const total = rows.length;
  const completed = rows.filter((row) => row.status === "Concluído").length;
  const notApplicable = rows.filter(
    (row) => row.status === "Não se aplica",
  ).length;
  const applicable = total - notApplicable;
  return {
    total,
    completed,
    notApplicable,
    applicable,
    incomplete: rows.filter((row) => row.status === "Não concluído").length,
    pending: rows.filter((row) => row.status === "A fazer").length,
    percentage: applicable ? Math.round((completed / applicable) * 100) : 0,
  };
}
