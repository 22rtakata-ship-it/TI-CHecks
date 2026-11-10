import { describe, it, expect } from "vitest";
import { initialData } from "@/lib/seed";
import {
  removeIncident,
  restoreIncident,
  updateIncident,
} from "@/features/incidents/service";
import { visibleActivities } from "@/features/activities/visibility";
import { monthlyReport } from "@/features/reports/service";
import type { Incident, Activity } from "@/types/domain";
const store = "295 — Itatiba";
const incident: Incident = {
  id: "i",
  title: "Registro incorreto",
  store,
  openedOn: "2026-11-01",
  status: "Pendente",
  ticket: "1233542",
  events: [
    {
      id: "e",
      date: "2026-11-01",
      at: "2026-11-01T12:00:00Z",
      status: "Pendente",
      text: "Identificação",
    },
  ],
};
const activity: Activity = {
  id: "a",
  title: "Atividade preservada",
  store,
  date: "2026-11-01",
  createdAt: "2026-11-01T12:00:00Z",
  status: "Concluído",
  sector: "",
  category: "Outros",
  equipment: "",
  problem: "",
  procedure: "",
  result: "",
  notes: "",
  ticket: "1233542",
  nextAction: "",
  dependency: "",
  followUp: "",
  incidentId: "i",
  revisions: [],
};
describe("Remoção reversível de ocorrências", () => {
  it("oculta somente atividades da ocorrência removida, não outras com o mesmo chamado", () => {
    const independent = { ...activity, id: "unrelated", incidentId: undefined };
    const another = { ...incident, id: "another" };
    const differentIncident = {
      ...activity,
      id: "different",
      incidentId: "another",
    };
    const data = {
      ...initialData(),
      activities: [activity, independent, differentIncident],
      incidents: [incident, another],
    };
    const removed = removeIncident(data, "i");
    expect(visibleActivities(removed).map((a) => a.id)).toEqual([
      "unrelated",
      "different",
    ]);
    expect(removed.activities).toHaveLength(3);
    expect(visibleActivities(restoreIncident(removed, "i"))).toEqual(
      data.activities,
    );
  });

  it("remove do acompanhamento e dos relatórios preservando dados vinculados", () => {
    const data = {
      ...initialData(),
      incidents: [incident],
      activities: [activity],
      evidence: [
        {
          id: "f",
          name: "antes.png",
          type: "image/png",
          size: 100,
          path: "owner/photo.png",
          kind: "Antes" as const,
          incidentId: "i",
        },
      ],
    };
    const removed = removeIncident(data, "i", "2026-11-07T13:00:00Z");
    expect(removed.incidents).toHaveLength(1);
    expect(removed.incidents[0].events).toEqual(incident.events);
    expect(removed.activities).toEqual(data.activities);
    expect(removed.evidence).toEqual(data.evidence);
    expect(data.incidents[0].deletedAt).toBeUndefined();
    const r = monthlyReport(removed, "2026-11", store);
    expect(r.pending).toHaveLength(0);
    expect(r.resolved).toHaveLength(0);
    expect(r.activities).toHaveLength(0);
  });
  it("restaura sem duplicar nem perder eventos e inclui novamente nos indicadores", () => {
    const data = { ...initialData(), incidents: [incident] };
    const restored = restoreIncident(removeIncident(data, "i"), "i");
    expect(restored.incidents).toEqual([incident]);
    expect(monthlyReport(restored, "2026-11", store).pending).toHaveLength(1);
  });
  it("impede atualização em ocorrência removida até restaurar", () => {
    const data = removeIncident(
      { ...initialData(), incidents: [incident] },
      "i",
    );
    expect(() =>
      updateIncident(data.incidents[0], {
        id: "e2",
        date: "2026-11-07",
        at: "2026-11-07T12:00:00Z",
        status: "Concluído",
        text: "Correção",
      }),
    ).toThrow(/Restaure/);
  });
});
