import { describe, it, expect } from "vitest";
import { initialData } from "@/lib/seed";
import {
  planned,
  saveExecution,
  scheduled,
  reviseTemplate,
} from "@/features/checklists/service";
import { saveActivity } from "@/features/activities/service";
import { updateIncident } from "@/features/incidents/service";
import { monthlyReport } from "@/features/reports/service";
import { validateFile } from "@/features/evidence/service";
import type { Activity, ChecklistExecution, Incident } from "@/types/domain";
const store = "295 — Itatiba";
const activity: Activity = {
  id: "a",
  title: "Religamento das TVs do açougue",
  date: "2027-01-08",
  createdAt: "2027-01-08T13:00:00Z",
  store,
  sector: "Açougue",
  category: "TVs e monitores",
  equipment: "TV",
  problem: "",
  procedure: "Religadas",
  result: "Funcionando",
  minutes: 10,
  status: "Concluído",
  ticket: "",
  notes: "",
  nextAction: "",
  dependency: "",
  followUp: "",
  revisions: [],
};
const execution: ChecklistExecution = {
  id: "e",
  templateId: initialData().templates[0].id,
  name: "Checklist diário",
  date: "2027-01-08",
  store,
  status: "Concluído",
  reason: "",
  notes: "",
};
const incident: Incident = {
  id: "i",
  title: "Placa-mãe PDV",
  store,
  openedOn: "2027-01-01",
  status: "Pendente",
  ticket: "1233542",
  events: [
    {
      id: "e1",
      date: "2027-01-01",
      at: "2027-01-01T13:00:00Z",
      text: "Aberto",
      status: "Pendente",
    },
  ],
};
describe("Regras de integridade TI Log", () => {
  it("acompanhamento após resolução não muda o mês da resolução", () => {
    const done = updateIncident(incident, {
      id: "done",
      date: "2027-01-05",
      at: "2027-01-05T13:00:00Z",
      text: "Resolvido",
      status: "Concluído",
    });
    const reviewed = updateIncident(done, {
      id: "review",
      date: "2027-02-03",
      at: "2027-02-03T13:00:00Z",
      text: "Verificado novamente",
      status: "Concluído",
    });
    const data = { ...initialData(), incidents: [reviewed] };
    expect(monthlyReport(data, "2027-01", store).resolved).toHaveLength(1);
    expect(monthlyReport(data, "2027-02", store).resolved).toHaveLength(0);
  });

  it("registra atividade rápida sem chamado ou ocorrência", () => {
    const result = saveActivity([], activity);
    expect(result[0].ticket).toBe("");
    expect(result[0].minutes).toBe(10);
    expect(result[0].incidentId).toBeUndefined();
  });
  it("preserva versões anteriores na edição", () => {
    const result = saveActivity([activity], {
      ...activity,
      title: "Atualizada",
    });
    expect(result).toHaveLength(1);
    expect(result[0].revisions[0].title).toBe(activity.title);
  });
  it("sexta 08/01/2027 tem apenas diário e coletores", () => {
    expect(
      planned(initialData().templates, [], "2027-01-08", store).map(
        (c) => c.name,
      ),
    ).toEqual(["Checklist diário", "Checklist de coletores"]);
  });
  it("alterações de modelo respeitam a vigência histórica", () => {
    const old = initialData().templates[0];
    const revised = reviseTemplate(
      old,
      { ...old, weekdays: [2] },
      "2027-01-09",
    );
    expect(scheduled(revised, "2027-01-08")).toBe(true);
    expect(scheduled(revised, "2027-01-15")).toBe(false);
    expect(scheduled(revised, "2027-01-12")).toBe(true);
  });
  it("domingo não tem checklist inicial", () =>
    expect(
      planned(initialData().templates, [], "2027-01-10", store),
    ).toHaveLength(0));
  it("exige motivo para não conclusão e não aplicação", () => {
    for (const status of ["Não concluído", "Não se aplica"] as const)
      expect(() =>
        saveExecution([], { ...execution, status, reason: "  " }),
      ).toThrow(/motivo/);
  });
  it("distingue a fazer de não concluído e impede duplicação", () => {
    expect(
      planned(initialData().templates, [], execution.date, store)[0].status,
    ).toBe("A fazer");
    const saved = saveExecution(saveExecution([], execution), {
      ...execution,
      id: "e2",
    });
    expect(saved).toHaveLength(1);
    expect(
      planned(initialData().templates, saved, execution.date, store),
    ).toHaveLength(2);
  });
  it("programa segunda e quarta e respeita limites de datas", () => {
    const template = {
      ...initialData().templates[0],
      weekdays: [1, 3],
      start: "2027-01-01",
      end: "2027-01-31",
    };
    expect(scheduled(template, "2027-01-04")).toBe(true);
    expect(scheduled(template, "2027-01-06")).toBe(true);
    expect(scheduled(template, "2027-01-05")).toBe(false);
    expect(scheduled(template, "2027-02-01")).toBe(false);
  });
  it("preserva execução ao alterar ou desativar programação", () => {
    const changed = initialData().templates.map((t) => ({
      ...t,
      weekdays: [1],
      active: false,
      name: "Novo nome",
    }));
    expect(planned(changed, [execution], execution.date, store)).toEqual([
      expect.objectContaining({
        name: "Checklist diário",
        status: "Concluído",
      }),
    ]);
  });
  it("permite ocorrência atravessar meses e reabrir sem duplicá-la", () => {
    const resolved = updateIncident(incident, {
      id: "e2",
      date: "2027-02-05",
      at: "2027-02-05T13:00:00Z",
      text: "Substituída",
      status: "Concluído",
    });
    const data = {
      ...initialData(),
      activities: [activity],
      incidents: [resolved],
    };
    expect(monthlyReport(data, "2027-01", store).resolved).toHaveLength(0);
    expect(monthlyReport(data, "2027-01", store).pending).toHaveLength(1);
    expect(monthlyReport(data, "2027-02", store).resolved).toHaveLength(1);
    const reopened = updateIncident(resolved, {
      id: "e3",
      date: "2027-02-06",
      at: "2027-02-06T13:00:00Z",
      text: "Nova falha",
      status: "Pendente",
    });
    expect(reopened.events).toHaveLength(3);
    expect(reopened.status).toBe("Pendente");
  });
  it("rejeita atualização anterior à abertura", () =>
    expect(() =>
      updateIncident(incident, {
        id: "e",
        date: "2026-12-01",
        at: "",
        text: "Inválida",
        status: "Pendente",
      }),
    ).toThrow());
  it("relatório não conta pendências e checklists como atividades", () => {
    const data = {
      ...initialData(),
      activities: [activity],
      incidents: [incident],
      executions: [execution],
    };
    const r = monthlyReport(data, "2027-01", store);
    expect(r.activities).toHaveLength(1);
    expect(r.pending).toHaveLength(1);
    expect(r.resolved).toHaveLength(0);
    expect(r.completed).toBe(1);
    expect(r.minutes).toBe(10);
  });
  it("valida formato e tamanho de evidências", () => {
    expect(() => validateFile({ size: 10, type: "text/html" })).toThrow();
    expect(() =>
      validateFile({ size: 11 * 1024 * 1024, type: "image/png" }),
    ).toThrow();
    expect(() =>
      validateFile({ size: 100, type: "application/pdf" }),
    ).not.toThrow();
  });
});
