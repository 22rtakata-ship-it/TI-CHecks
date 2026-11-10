import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import { initialData } from "@/lib/seed";
import { formatDuration } from "@/lib/duration";
import {
  createReportWorkbook,
  dashboardMetrics,
  monthlyReport,
  reportSummary,
} from "@/features/reports/service";
import type { Activity, AppData, Incident } from "@/types/domain";

const store = "295 — Itatiba";
const activity: Activity = {
  id: "activity-1",
  date: "2027-01-06",
  createdAt: "2027-01-06T14:00:00Z",
  store,
  title: "Atendimento de teste",
  category: "Computadores",
  sector: "Administrativo",
  equipment: "",
  problem: "",
  procedure: "Procedimento registrado",
  result: "Concluído",
  minutes: 672,
  notes: "",
  status: "Concluído",
  ticket: "",
  nextAction: "",
  dependency: "",
  followUp: "",
  revisions: [],
};
const incident: Incident = {
  id: "incident-1",
  title: "Ocorrência iniciada no mês anterior",
  store,
  openedOn: "2026-12-30",
  status: "Concluído",
  ticket: "",
  events: [
    {
      id: "opening",
      date: "2026-12-30",
      at: "2026-12-30T14:00:00Z",
      text: "Aguardando retorno",
      status: "Aguardando terceiros",
    },
    {
      id: "resolution",
      date: "2027-01-10",
      at: "2027-01-10T14:00:00Z",
      text: "Resolvido",
      status: "Concluído",
    },
  ],
};
function exampleData(): AppData {
  const seed = initialData();
  return {
    ...seed,
    activities: [activity],
    incidents: [incident],
    templates: [{ ...seed.templates[0], weekdays: [1, 3] }],
    executions: [
      {
        id: "execution-1",
        templateId: seed.templates[0].id,
        name: "Checklist diário",
        date: "2027-01-04",
        store,
        status: "Concluído",
        reason: "",
        notes: "",
      },
    ],
  };
}

describe("Apresentação de tempo em horas", () => {
  it.each([
    [672, "11 h 12 min"],
    [60, "1 h"],
    [0, "0 h"],
    [10, "0 h 10 min"],
    [120, "2 h"],
    [61, "1 h 1 min"],
  ])("formata %i minutos como %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it("mantém minutos na fonte de dados e usa horas no resumo e e-mail", () => {
    const data = exampleData();
    const report = monthlyReport(data, "2027-01", store);
    expect(report.minutes).toBe(672);
    expect(data.activities[0].minutes).toBe(672);
    expect(reportSummary(report, "2027-01", store)).toContain("11 h 12 min");
    expect(reportSummary(report, "2027-01", store)).not.toContain(
      "672 minutos",
    );
  });

  it("exporta horas numéricas no XLSX, preservando valores ausentes", async () => {
    const data = exampleData();
    data.activities.push({
      ...activity,
      id: "without-time",
      minutes: undefined,
    });
    const workbook = await createReportWorkbook(data, "2027-01", store, "");
    const loaded = new Workbook();
    await loaded.xlsx.load(await workbook.xlsx.writeBuffer());
    const activities = loaded.getWorksheet("Atividades")!;
    expect(activities.getCell("K1").value).toBe("Tempo (horas)");
    expect(activities.getCell("K2").value).toBe(11.2);
    expect(activities.getCell("K2").numFmt).toBe('0.00" h"');
    expect(activities.getCell("K3").value).toBeNull();
    expect(loaded.getWorksheet("Resumo")!.getCell("B3").value).toBe(11.2);
    expect(data.activities[0].minutes).toBe(672);
  });
});

describe("Dashboard e relatórios por período", () => {
  it("separa previsões futuras do percentual da rotina até hoje", () => {
    const metrics = dashboardMetrics(
      exampleData(),
      "2027-01",
      store,
      "2027-01-06",
    );
    expect(metrics.report.checklists).toHaveLength(8);
    expect(metrics.dueChecklists).toHaveLength(2);
    expect(metrics.futureChecklists).toHaveLength(6);
    expect(metrics.checklistPercent).toBe(50);
    expect(
      metrics.dueChecklists.find((c) => c.date === "2027-01-06")?.status,
    ).toBe("A fazer");
  });

  it("usa o mês inteiro para meses encerrados e não altera o relatório mensal", () => {
    const data = exampleData();
    const metrics = dashboardMetrics(data, "2027-01", store, "2027-02-05");
    expect(metrics.cutoff).toBe("2027-01-31");
    expect(metrics.dueChecklists).toHaveLength(8);
    expect(metrics.futureChecklists).toHaveLength(0);
    expect(metrics.checklistPercent).toBe(13);
    expect(monthlyReport(data, "2027-01", store).execution).toBe(13);
  });

  it("reconstitui ocorrências até a data sem contá-las como atividades", () => {
    const metrics = dashboardMetrics(
      exampleData(),
      "2027-01",
      store,
      "2027-01-06",
    );
    expect(metrics.pending).toHaveLength(1);
    expect(metrics.waiting).toHaveLength(1);
    expect(metrics.resolved).toHaveLength(0);
    expect(metrics.report.activities).toHaveLength(1);
    expect(metrics.categories).toEqual([["Computadores", 1]]);
    const nextMonth = monthlyReport(exampleData(), "2027-02", store);
    expect(nextMonth.activities).toHaveLength(0);
    expect(nextMonth.resolved).toHaveLength(0);
  });

  it("exclui ocorrências removidas de indicadores e planilhas sem apagar atividades", async () => {
    const data = exampleData();
    data.incidents = [{ ...incident, deletedAt: "2027-01-06T15:00:00Z" }];
    const metrics = dashboardMetrics(data, "2027-01", store, "2027-01-06");
    expect(metrics.pending).toHaveLength(0);
    expect(metrics.waiting).toHaveLength(0);
    expect(metrics.report.pending).toHaveLength(0);
    expect(metrics.report.resolved).toHaveLength(0);
    expect(metrics.report.activities).toHaveLength(1);
    const workbook = await createReportWorkbook(data, "2027-01", store, "");
    expect(workbook.getWorksheet("Ocorrências")!.rowCount).toBe(1);
  });
});
