import { describe, expect, it } from "vitest";
import { initialData } from "@/lib/seed";
import { checklistMetrics } from "@/features/checklists/metrics";
import {
  createReportWorkbook,
  dashboardMetrics,
  monthlyReport,
  reportSummary,
} from "@/features/reports/service";
import type { AppData, ChecklistExecution } from "@/types/domain";

const store = "295 — Itatiba";
const dates = [
  "2027-01-04",
  "2027-01-05",
  "2027-01-06",
  "2027-01-07",
  "2027-01-08",
  "2027-01-11",
  "2027-01-12",
  "2027-01-13",
  "2027-01-14",
];
function dataWithExecutions(): AppData {
  const data = initialData();
  const template = {
    ...data.templates[0],
    start: dates[0],
    end: dates.at(-1)!,
  };
  const executions: ChecklistExecution[] = dates.map((date, index) => ({
    id: `execution-${index}`,
    templateId: template.id,
    name: template.name,
    date,
    store,
    status: index === 1 ? "Não se aplica" : "Concluído",
    reason: index === 1 ? "Setor fechado" : "",
    notes: "",
  }));
  return { ...data, templates: [template], executions };
}

describe("Percentual de checklists aplicáveis", () => {
  it("oito concluídos e um não aplicável resultam em cem por cento, mantendo a distribuição", () => {
    const result = checklistMetrics(dataWithExecutions().executions);
    expect(result).toEqual({
      total: 9,
      completed: 8,
      notApplicable: 1,
      applicable: 8,
      incomplete: 0,
      pending: 0,
      percentage: 100,
    });
  });
  it("não preenchido e não concluído continuam no denominador", () => {
    expect(
      checklistMetrics([
        { status: "Concluído" },
        { status: "Não concluído" },
        { status: "A fazer" },
        { status: "Não se aplica" },
      ]),
    ).toMatchObject({
      total: 4,
      applicable: 3,
      completed: 1,
      incomplete: 1,
      pending: 1,
      percentage: 33,
    });
  });
  it("nenhum aplicável não produz NaN nem cem por cento fictícios", () => {
    expect(checklistMetrics([])).toMatchObject({
      applicable: 0,
      percentage: 0,
    });
    expect(checklistMetrics([{ status: "Não se aplica" }])).toMatchObject({
      total: 1,
      notApplicable: 1,
      applicable: 0,
      percentage: 0,
    });
  });
  it("dashboard, relatório e texto para e-mail usam a mesma base de aplicáveis", () => {
    const data = dataWithExecutions();
    const metrics = dashboardMetrics(data, "2027-01", store, "2027-01-14");
    const report = monthlyReport(data, "2027-01", store);
    expect(metrics.dueChecklists).toHaveLength(9);
    expect(metrics).toMatchObject({
      completed: 8,
      applicable: 8,
      notApplicable: 1,
      checklistPercent: 100,
    });
    expect(report).toMatchObject({
      completed: 8,
      applicable: 8,
      notApplicable: 1,
      execution: 100,
    });
    expect(reportSummary(report, "2027-01", store)).toContain(
      "8 de 8 checklists aplicáveis (100%)",
    );
    expect(reportSummary(report, "2027-01", store)).toContain(
      "não aplicáveis: 1, fora do percentual",
    );
  });
  it("lista de não preenchidos mantém datas e não inclui previsões futuras ou outra loja", () => {
    const data = dataWithExecutions();
    data.executions = data.executions.filter(
      (e) => !["2027-01-06", "2027-01-12"].includes(e.date),
    );
    data.executions.push({
      ...data.executions[0],
      id: "other-store",
      store: "178 — Indaiatuba",
      date: "2027-01-06",
    });
    const metrics = dashboardMetrics(data, "2027-01", store, "2027-01-08");
    const pending = metrics.dueChecklists.filter((e) => e.status === "A fazer");
    expect(pending.map((e) => [e.date, e.name, e.store])).toEqual([
      ["2027-01-06", "Checklist diário", store],
    ]);
    expect(metrics.futureChecklists.some((e) => e.date === "2027-01-12")).toBe(
      true,
    );
    expect(metrics).toMatchObject({
      completed: 3,
      applicable: 4,
      notApplicable: 1,
      checklistPercent: 75,
    });
  });
  it("exibe a ausência de aplicáveis no resumo quando tudo está não aplicável", () => {
    const data = dataWithExecutions();
    data.executions = data.executions.map((e) => ({
      ...e,
      status: "Não se aplica",
      reason: "Não aplicável",
    }));
    const report = monthlyReport(data, "2027-01", store);
    expect(report).toMatchObject({
      completed: 0,
      notApplicable: 9,
      applicable: 0,
      execution: 0,
    });
    expect(reportSummary(report, "2027-01", store)).toContain(
      "Nenhum checklist aplicável ao período",
    );
  });
  it("exporta quantidade aplicável e porcentagem correta na planilha sem omitir os não aplicáveis", async () => {
    const workbook = await createReportWorkbook(
      dataWithExecutions(),
      "2027-01",
      store,
      "",
    );
    const summary = workbook.getWorksheet("Resumo")!;
    const values = new Map<string, unknown>();
    summary.eachRow((row) =>
      values.set(String(row.getCell(1).value), row.getCell(2).value),
    );
    expect(values.get("Checklists previstos")).toBe(9);
    expect(values.get("Checklists aplicáveis")).toBe(8);
    expect(values.get("Checklists não aplicáveis")).toBe(1);
    expect(values.get("Execução dos checklists aplicáveis")).toBe(1);
    expect(workbook.getWorksheet("Checklists")!.rowCount).toBe(10);
  });
});
