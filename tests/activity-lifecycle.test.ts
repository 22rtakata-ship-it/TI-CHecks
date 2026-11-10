import { describe, expect, it } from "vitest";
import type { Activity, AppData, Incident } from "@/types/domain";
import { initialData } from "@/lib/seed";
import { activityDescription } from "@/features/activities/description";
import {
  removeActivity,
  restoreActivity,
  searchActivities,
} from "@/features/activities/service";
import { visibleActivities } from "@/features/activities/visibility";
import { prepareActivitySave } from "@/features/activities/workflow";
import { monthlyReport } from "@/features/reports/selectors";

const store = "295 — Itatiba";
const activity: Activity = {
  id: "activity-original",
  date: "2026-11-02",
  createdAt: "2026-11-02T12:00:00Z",
  store,
  title: "Diagnóstico do PDV",
  sector: "Frente de caixa",
  category: "PDV / Frente de caixa",
  equipment: "PDV 03",
  problem: "Equipamento sem inicialização",
  procedure: "Testes de alimentação realizados",
  result: "Falha identificada na placa-mãe",
  minutes: 30,
  notes: "Equipamento reservado para manutenção",
  status: "Concluído",
  ticket: "1233542",
  nextAction: "Substituir a placa",
  dependency: "Assistência técnica",
  followUp: "2026-11-05",
  incidentId: "incident-original",
  checklistId: "checklist-original",
  revisions: [
    {
      at: "2026-11-02T12:30:00Z",
      title: "Verificação do PDV",
      status: "Em andamento",
    },
  ],
};
const incident: Incident = {
  id: "incident-original",
  title: "Falha na placa-mãe",
  store,
  openedOn: "2026-11-02",
  status: "Aguardando terceiros",
  ticket: "1233542",
  events: [
    {
      id: "event-original",
      date: "2026-11-02",
      at: "2026-11-02T12:00:00Z",
      text: "Aguardando substituição da placa",
      status: "Aguardando terceiros",
      activityId: activity.id,
    },
  ],
};

function workspace(): AppData {
  return {
    ...initialData(),
    activities: [
      activity,
      { ...activity, id: "independent", incidentId: undefined },
    ],
    incidents: [incident],
    evidence: [
      {
        id: "evidence-original",
        name: "diagnostico.png",
        type: "image/png",
        size: 1024,
        path: "owner/diagnostico.png",
        kind: "Antes",
        activityId: activity.id,
      },
    ],
  };
}

describe("Descrição de atividades novas e legadas", () => {
  it("reúne os detalhes legados sem alterar o registro original", () => {
    const before = structuredClone(activity);
    const description = activityDescription(activity);
    for (const detail of [
      activity.problem,
      activity.procedure,
      activity.result,
      activity.notes,
    ])
      expect(description).toContain(detail);
    expect(
      description.split("\n").filter(Boolean).length,
    ).toBeGreaterThanOrEqual(4);
    expect(activity).toEqual(before);
  });

  it("prioriza a descrição atual inclusive quando o usuário a deixa vazia", () => {
    expect(
      activityDescription({ ...activity, description: "Placa substituída." }),
    ).toBe("Placa substituída.");
    expect(activityDescription({ ...activity, description: "" })).toBe("");
  });

  it("não inventa descrição para campos legados vazios", () => {
    expect(
      activityDescription({
        ...activity,
        problem: "  ",
        procedure: "",
        result: "\n",
        notes: "",
      }),
    ).toBe("");
  });
});

describe("Remoção reversível de uma atividade", () => {
  it("oculta só a atividade escolhida e preserva ocorrência, eventos e evidências", () => {
    const data = workspace();
    const before = structuredClone(data);
    const removed = removeActivity(data, activity.id, "2026-11-10T12:00:00Z");

    expect(data).toEqual(before);
    expect(removed.activities).toHaveLength(2);
    expect(removed.activities[0]).toEqual({
      ...activity,
      deletedAt: "2026-11-10T12:00:00Z",
    });
    expect(removed.incidents).toEqual(data.incidents);
    expect(removed.incidents[0].events[0].activityId).toBe(activity.id);
    expect(removed.evidence).toEqual(data.evidence);
    expect(visibleActivities(removed).map((a) => a.id)).toEqual([
      "independent",
    ]);
    expect(searchActivities(removed.activities, store, "1233542")).toEqual([
      data.activities[1],
    ]);
    const report = monthlyReport(removed, "2026-11", store);
    expect(report.activities.map((a) => a.id)).toEqual(["independent"]);
    expect(report.minutes).toBe(30);
    expect(report.pending.map((i) => i.id)).toEqual([incident.id]);
  });

  it("mantém a primeira data de remoção se a operação for repetida", () => {
    const once = removeActivity(
      workspace(),
      activity.id,
      "2026-11-10T12:00:00Z",
    );
    const twice = removeActivity(once, activity.id, "2026-11-11T12:00:00Z");
    expect(twice).toEqual(once);
  });

  it("restaura o registro completo sem duplicar nem remover metadados", () => {
    const data = workspace();
    const removed = removeActivity(data, activity.id);
    const restored = restoreActivity(removed, activity.id);
    expect(restored).toEqual(data);
    expect(removed.activities[0].deletedAt).toBeDefined();
    expect(visibleActivities(restored)).toEqual(data.activities);
    expect(monthlyReport(restored, "2026-11", store).minutes).toBe(60);
  });

  it("restaurar a atividade não restaura implicitamente uma ocorrência removida", () => {
    const data = workspace();
    data.incidents = [{ ...incident, deletedAt: "2026-11-09T12:00:00Z" }];
    const restored = restoreActivity(
      removeActivity(data, activity.id),
      activity.id,
    );
    expect(visibleActivities(restored).map((a) => a.id)).toEqual([
      "independent",
    ]);
    expect(restored.incidents).toEqual(data.incidents);
  });

  it("informa quando a atividade não existe", () => {
    expect(() => removeActivity(workspace(), "missing")).toThrow();
    expect(() => restoreActivity(workspace(), "missing")).toThrow();
  });
});

describe("Descrição no acompanhamento de ocorrências", () => {
  it("abre ocorrência com a descrição nova sem resolver o problema pela conclusão da atividade", () => {
    const data = initialData();
    const entry: Activity = {
      ...activity,
      incidentId: undefined,
      description: "PDV diagnosticado; substituição ainda pendente.",
    };
    const next = prepareActivitySave(data, entry, true);
    expect(data.activities).toHaveLength(0);
    expect(data.incidents).toHaveLength(0);
    expect(next.incidents).toHaveLength(1);
    expect(next.incidents[0].status).toBe("Pendente");
    expect(next.incidents[0].events[0]).toMatchObject({
      text: entry.description,
      activityId: entry.id,
      date: entry.date,
    });
    expect(next.activities[0].incidentId).toBe(next.incidents[0].id);
    expect(next.activities[0].equipment).toBe(activity.equipment);
  });

  it("registra a intervenção com descrição sem alterar o status da ocorrência", () => {
    const data = workspace();
    const followUp: Activity = {
      ...activity,
      id: "follow-up",
      date: "2026-11-05",
      description: "Fornecedor confirmou envio da peça.",
    };
    const next = prepareActivitySave(data, followUp, false);
    expect(next.incidents[0].status).toBe(incident.status);
    expect(next.incidents[0].events).toHaveLength(2);
    expect(next.incidents[0].events[1]).toMatchObject({
      text: followUp.description,
      date: followUp.date,
      activityId: followUp.id,
    });
    expect(data.incidents[0].events).toHaveLength(1);
    const edited = prepareActivitySave(
      next,
      { ...next.activities.at(-1)!, description: "Correção da descrição." },
      false,
    );
    expect(edited.incidents[0].events).toHaveLength(2);
  });
});
