import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Workbook } from "exceljs";
import { initialData } from "@/lib/seed";
import type { Activity, Incident } from "@/types/domain";
import { reportMonthLabel } from "@/features/reports/calendar";
import { monthlyReport } from "@/features/reports/selectors";
import { reportSummary } from "@/features/reports/summary";
import { createReportWorkbook } from "@/features/reports/workbook";
import { technicalActivityFields } from "@/features/reports/report/technical-fields";
import { ReportIncidentSections } from "@/features/reports/report/ReportIncidentSections";
import { ReportActivityEntries } from "@/features/reports/report/ReportActivityEntries";

const store = "295 — Itatiba";
const activity: Activity = {
  id: "activity",
  date: "2027-01-06",
  createdAt: "2027-01-06T14:00:00Z",
  store,
  title: "Reparo no PDV",
  category: "PDV / Frente de caixa",
  sector: "Frente de caixa",
  equipment: "PDV 01",
  problem: "Não inicia",
  procedure: "Substituição da fonte",
  result: "Equipamento voltou a funcionar",
  notes: "Teste acompanhado pelo setor",
  minutes: 90,
  status: "Concluído",
  ticket: "INC123",
  nextAction: "",
  dependency: "",
  followUp: "",
  revisions: [],
};
function incident(id: string, resolution: string): Incident {
  return {
    id,
    title: `Ocorrência ${id}`,
    store,
    openedOn: "2026-12-28",
    status: "Concluído",
    ticket: "",
    events: [
      {
        id: `${id}-open`,
        date: "2026-12-28",
        at: "2026-12-28T14:00:00Z",
        text: "Aguardando peça",
        status: "Aguardando terceiros",
      },
      {
        id: `${id}-resolved`,
        date: resolution,
        at: `${resolution}T14:00:00Z`,
        text: "Peça substituída",
        status: "Concluído",
      },
    ],
  };
}
function data() {
  return {
    ...initialData(),
    activities: [activity],
    templates: [],
    executions: [],
    incidents: [
      incident("janeiro", "2027-01-10"),
      incident("fevereiro", "2027-02-03"),
    ],
  };
}

describe("Relatório técnico objetivo e compatível", () => {
  it("apresenta exatamente os seis campos solicitados e N/A para valores vazios", () => {
    const fields = technicalActivityFields({
      ...activity,
      title: " ",
      sector: "",
      category: " ",
      ticket: "",
      status: "" as Activity["status"],
      description: "  ",
    });
    expect(fields.map(([label]) => label)).toEqual([
      "Título",
      "Setor",
      "Categoria",
      "Chamado",
      "Status",
      "Descrição",
    ]);
    expect(fields.map(([, value]) => value)).toEqual(Array(6).fill("N/A"));
  });

  it("mantém legíveis todos os detalhes dos registros antigos sem alterá-los", () => {
    const snapshot = structuredClone(activity);
    const fields = technicalActivityFields(activity);
    const description = fields.find(([label]) => label === "Descrição")![1];
    expect(description).toContain(activity.problem);
    expect(description).toContain(activity.procedure);
    expect(description).toContain(activity.result);
    expect(description).toContain(activity.notes);
    expect(activity).toEqual(snapshot);
    expect(
      technicalActivityFields({
        ...activity,
        description: "Descrição revisada",
      }).at(-1),
    ).toEqual(["Descrição", "Descrição revisada"]);
  });

  it("renderiza os campos objetivos no técnico com descrição legada e N/A", () => {
    const html = renderToStaticMarkup(
      createElement(ReportActivityEntries, {
        activities: [{ ...activity, ticket: "" }],
        evidence: [],
        mode: "Técnico",
      }),
    );
    expect(html.match(/<dt>/g)).toHaveLength(6);
    expect(html).toContain("<dt>Título</dt>");
    expect(html).toContain("<dt>Categoria</dt>");
    expect(html).toContain("<dt>Chamado</dt><dd>N/A</dd>");
    expect(html).toContain("<dt>Descrição</dt>");
    expect(html).toContain(activity.procedure);
    expect(html).toContain(activity.result);
  });

  it("usa mês por extenso e uma informação por linha no resumo", () => {
    const report = monthlyReport(data(), "2027-01", store);
    const summary = reportSummary(report, "2027-01", store);
    expect(reportMonthLabel("2027-01")).toBe("janeiro de 2027");
    expect(summary.split("\n")).toHaveLength(6);
    expect(summary).toContain("No período de janeiro de 2027");
    expect(summary).not.toContain("01/2027");
    expect(summary.split("\n")[1]).toBe(
      "Tempo registrado nas atividades: 1 h 30 min.",
    );
    expect(summary.split("\n").at(-2)).toBe(
      "Ocorrências resolvidas no mês: 1.",
    );
    expect(summary.split("\n").at(-1)).toBe(
      "Ocorrências pendentes ao final do período: 1.",
    );
  });

  it("separa títulos concluídos e pendentes com data e status do período correto", () => {
    const report = monthlyReport(data(), "2027-01", store);
    const html = renderToStaticMarkup(
      createElement(ReportIncidentSections, {
        resolved: report.resolved,
        pending: report.pending,
        month: "2027-01",
      }),
    );
    expect(html).toContain('class="report-incident-columns"');
    expect(html).toContain('aria-label="Ocorrências concluídas no mês"');
    expect(html.toLowerCase()).toContain('datetime="2027-01-10"');
    expect(html).toContain("10/01/2027");
    expect(html).toContain("Ocorrência janeiro");
    expect(html).toContain("Ocorrência fevereiro");
    expect(html).toContain("Aguardando terceiros");
    expect(html).not.toContain("03/02/2027");
    expect(html).not.toContain("Peça substituída");
  });

  it("informa explicitamente quando não há ocorrências em cada coluna", () => {
    const html = renderToStaticMarkup(
      createElement(ReportIncidentSections, {
        resolved: [],
        pending: [],
        month: "2027-01",
      }),
    );
    expect(html).toContain("Nenhuma ocorrência concluída neste mês.");
    expect(html).toContain(
      "Nenhuma ocorrência pendente ao final deste período.",
    );
  });

  it("mantém dados antigos e horas no XLSX e acrescenta descrição e situação por mês", async () => {
    const snapshot = data();
    snapshot.activities = [{ ...activity, ticket: "", sector: "" }];
    const workbook = await createReportWorkbook(snapshot, "2027-01", store, "");
    const loaded = new Workbook();
    await loaded.xlsx.load(await workbook.xlsx.writeBuffer());
    const activities = loaded.getWorksheet("Atividades")!;
    expect(activities.getCell("C2").value).toBe("N/A");
    expect(activities.getCell("J2").value).toBe("N/A");
    expect(activities.getCell("G2").value).toBe(activity.procedure);
    expect(activities.getCell("H2").value).toBe(activity.result);
    expect(activities.getCell("K2").value).toBe(1.5);
    expect(activities.getCell("M1").value).toBe("Descrição");
    expect(activities.getCell("M2").value).toContain(activity.problem);
    expect(activities.getCell("M2").value).toContain(activity.procedure);
    const incidents = loaded.getWorksheet("Ocorrências")!;
    expect(incidents.getCell("A2").value).toBe("Ocorrência janeiro");
    expect(incidents.getCell("E2").value).toBe("Concluída no mês");
    expect(incidents.getCell("F2").value).toBe("2027-01-10");
    expect(incidents.getCell("A3").value).toBe("Ocorrência fevereiro");
    expect(incidents.getCell("C3").value).toBe("Aguardando terceiros");
    expect(incidents.getCell("E3").value).toBe("Pendente ao final do período");
    expect(incidents.getCell("F3").value).toBe("N/A");
  });
});
