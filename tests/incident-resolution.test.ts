import { describe, expect, it } from "vitest";
import {
  resolutionDate,
  statusForResolution,
  statusOn,
  updateIncident,
} from "@/features/incidents/service";
import type { Incident } from "@/features/incidents/types";

const incident: Incident = {
  id: "incident",
  title: "Falha de PDV",
  store: "295 — Itatiba",
  openedOn: "2026-10-30",
  status: "Pendente",
  ticket: "1233542",
  events: [
    {
      id: "opened",
      date: "2026-10-30",
      at: "2026-10-30T12:00:00Z",
      text: "Aguardando assistência.",
      status: "Pendente",
    },
  ],
};

describe("Resolução explícita de ocorrências", () => {
  it("representa Sim como Concluído e Não como um status em acompanhamento", () => {
    for (const status of [
      "Pendente",
      "Em andamento",
      "Aguardando terceiros",
      "Concluído",
    ] as const) {
      expect(statusForResolution(status, true)).toBe("Concluído");
      expect(statusForResolution(status, false)).toBe(
        status === "Concluído" ? "Em andamento" : status,
      );
    }
  });

  it("preserva abertura e eventos anteriores ao resolver e reabrir em outro mês", () => {
    const resolved = updateIncident(incident, {
      id: "resolved",
      date: "2026-11-03",
      at: "2026-11-03T14:00:00Z",
      text: "Peça substituída; equipamento voltou a funcionar.",
      status: statusForResolution(incident.status, true),
    });
    const reopened = updateIncident(resolved, {
      id: "reopened",
      date: "2026-12-01",
      at: "2026-12-01T13:00:00Z",
      text: "Falha retornou; nova avaliação necessária.",
      status: statusForResolution(resolved.status, false),
    });

    expect(reopened.status).toBe("Em andamento");
    expect(reopened.openedOn).toBe(incident.openedOn);
    expect(reopened.events.slice(0, 2)).toEqual(resolved.events);
    expect(reopened.events[0]).toEqual(incident.events[0]);
    expect(incident.events).toHaveLength(1);
    expect(statusOn(reopened, "2026-10-31")).toBe("Pendente");
    expect(resolutionDate(reopened, "2026-11-30")).toBe("2026-11-03");
    expect(resolutionDate(reopened, "2026-12-31")).toBeUndefined();
  });

  it("exige o relato da atualização e rejeita datas anteriores à abertura", () => {
    const event = {
      id: "invalid",
      date: "2026-11-03",
      at: "2026-11-03T14:00:00Z",
      text: "   ",
      status: statusForResolution(incident.status, true),
    };
    expect(() => updateIncident(incident, event)).toThrow(
      "Descreva a atualização.",
    );
    expect(() =>
      updateIncident(incident, {
        ...event,
        date: "2026-10-29",
        text: "Resolvido.",
      }),
    ).toThrow("A atualização não pode anteceder a abertura.");
  });
});
