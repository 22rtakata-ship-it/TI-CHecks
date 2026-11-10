import type { AppData, Incident, IncidentEvent, Status } from "@/types/domain";

/** Resolution is represented by the event status, without a second persisted flag. */
export function statusForResolution(status: Status, resolved: boolean): Status {
  if (resolved) return "Concluído";
  return status === "Concluído" ? "Em andamento" : status;
}

export function updateIncident(
  incident: Incident,
  event: IncidentEvent,
): Incident {
  if (incident.deletedAt)
    throw new Error("Restaure a ocorrência antes de adicionar atualizações.");
  if (event.date < incident.openedOn)
    throw new Error("A atualização não pode anteceder a abertura.");
  if (!event.text.trim()) throw new Error("Descreva a atualização.");
  const events = [...incident.events, event].sort(
    (a, b) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at),
  );
  return { ...incident, events, status: events.at(-1)!.status };
}
export function statusOn(incident: Incident, date: string): Status | undefined {
  return incident.events.filter((e) => e.date <= date).at(-1)?.status;
}

export function resolutionDate(
  incident: Incident,
  cutoff: string,
): string | undefined {
  let previous: Status | undefined;
  let resolved: string | undefined;
  for (const event of incident.events.filter((e) => e.date <= cutoff)) {
    if (event.status === "Concluído" && previous !== "Concluído")
      resolved = event.date;
    if (event.status !== "Concluído") resolved = undefined;
    previous = event.status;
  }
  return resolved;
}

export function removeIncident(
  data: AppData,
  incidentId: string,
  at = new Date().toISOString(),
): AppData {
  const incident = data.incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error("Ocorrência não encontrada.");
  if (incident.deletedAt) return data;
  return {
    ...data,
    incidents: data.incidents.map((i) =>
      i.id === incidentId ? { ...i, deletedAt: at } : i,
    ),
  };
}
export function restoreIncident(data: AppData, incidentId: string): AppData {
  const incident = data.incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error("Ocorrência não encontrada.");
  return {
    ...data,
    incidents: data.incidents.map((i) => {
      if (i.id !== incidentId) return i;
      const { deletedAt, ...rest } = i;
      return rest;
    }),
  };
}
