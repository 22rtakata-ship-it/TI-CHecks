import { formatDuration } from "@/lib/duration";
import type { monthlyReport } from "./selectors";
import { reportMonthLabel } from "./calendar";

export function reportSummary(
  report: ReturnType<typeof monthlyReport>,
  month: string,
  store: string,
) {
  const executionText = report.applicable
    ? `Foram concluídos ${report.completed} de ${report.applicable} checklists aplicáveis (${report.execution}%).`
    : "Nenhum checklist aplicável ao período.";
  return [
    `No período de ${reportMonthLabel(month)}, foram registradas ${report.activities.length} atividades na loja ${store}.`,
    `Tempo registrado nas atividades: ${formatDuration(report.minutes)}.`,
    executionText,
    `Checklists não aplicáveis: ${report.notApplicable}, fora do percentual.`,
    `Ocorrências resolvidas no mês: ${report.resolved.length}.`,
    `Ocorrências pendentes ao final do período: ${report.pending.length}.`,
  ].join("\n");
}
