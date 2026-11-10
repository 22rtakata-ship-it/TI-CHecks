import type { AppData } from "@/types/domain";
import { resolutionDate, statusOn } from "@/features/incidents/service";
import { activityDescription } from "@/features/activities/description";
import { monthEnd } from "./calendar";
import { monthlyReport } from "./selectors";
import { reportValue } from "./report/technical-fields";

/** A workbook builder keeps export values testable without browser download APIs. */
export async function createReportWorkbook(
  data: AppData,
  month: string,
  store: string,
  category: string,
) {
  const { Workbook } = await import("exceljs");
  const report = monthlyReport(data, month, store, category);
  const book = new Workbook();
  const sheet = book.addWorksheet("Atividades");
  sheet.addRow([
    "Data",
    "Título",
    "Setor",
    "Categoria",
    "Equipamento",
    "Problema",
    "Procedimento",
    "Resultado",
    "Status",
    "Chamado",
    "Tempo (horas)",
    "Evidências",
    "Descrição",
  ]);
  report.activities.forEach((a) =>
    sheet.addRow([
      a.date,
      reportValue(a.title),
      reportValue(a.sector),
      reportValue(a.category),
      reportValue(a.equipment),
      reportValue(a.problem),
      reportValue(a.procedure),
      reportValue(a.result),
      reportValue(a.status),
      reportValue(a.ticket),
      a.minutes === undefined ? undefined : a.minutes / 60,
      reportValue(
        data.evidence
          .filter((e) => e.activityId === a.id)
          .map((e) => e.name)
          .join("; "),
      ),
      reportValue(activityDescription(a)),
    ]),
  );
  const checks = book.addWorksheet("Checklists");
  checks.addRow(["Nome", "Data", "Status", "Motivo", "Observações"]);
  report.checklists.forEach((c) =>
    checks.addRow([
      c.name,
      c.date,
      c.status,
      c.execution?.reason || "",
      c.execution?.notes || "",
    ]),
  );
  const incidents = book.addWorksheet("Ocorrências");
  incidents.addRow([
    "Título",
    "Abertura",
    "Status no fim do mês",
    "Chamado",
    "Situação no período",
    "Data de conclusão",
  ]);
  const resolvedIds = new Set(report.resolved.map((incident) => incident.id));
  [...report.resolved, ...report.pending].forEach((i) =>
    incidents.addRow([
      reportValue(i.title),
      i.openedOn,
      reportValue(statusOn(i, monthEnd(month))),
      reportValue(i.ticket),
      resolvedIds.has(i.id)
        ? "Concluída no mês"
        : "Pendente ao final do período",
      resolutionDate(i, monthEnd(month)) || "N/A",
    ]),
  );
  book.eachSheet((s) => {
    s.getRow(1).font = { bold: true };
    s.columns.forEach((c) => {
      c.width = 28;
    });
  });
  sheet.getColumn(11).numFmt = '0.00" h"';
  const summary = book.addWorksheet("Resumo");
  summary.addRow(["Indicador", "Valor"]);
  summary.addRows([
    ["Atividades", report.activities.length],
    ["Tempo registrado (horas)", report.minutes / 60],
    ["Checklists previstos", report.checklists.length],
    ["Checklists concluídos", report.completed],
    ["Ocorrências resolvidas", report.resolved.length],
    ["Ocorrências pendentes", report.pending.length],
    ["Checklists aplicáveis", report.applicable],
    ["Checklists não aplicáveis", report.notApplicable],
  ]);
  summary
    .addRow(["Execução dos checklists aplicáveis", report.execution / 100])
    .getCell(2).numFmt = "0%";
  summary.getCell("B3").numFmt = '0.00" h"';
  summary.getRow(1).font = { bold: true };
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 22;
  return book;
}
