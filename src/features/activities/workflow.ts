import type { Activity, AppData } from "@/types/domain";
import { id } from "@/lib/date";
import { saveActivity } from "./service";
import { activityDescription } from "./description";
import { updateIncident } from "@/features/incidents/service";

export function prepareActivitySave(
  data: AppData,
  a: Activity,
  createIncident: boolean,
): AppData {
  if (a.incidentId) {
    const linked = data.incidents.find((i) => i.id === a.incidentId);
    if (!linked || linked.store !== a.store)
      throw new Error("A atividade deve pertencer à mesma loja da ocorrência.");
    if (linked.deletedAt && !data.activities.some((x) => x.id === a.id))
      throw new Error(
        "Restaure a ocorrência antes de vincular novas atividades.",
      );
    if (a.date < linked.openedOn)
      throw new Error("A atividade não pode anteceder a ocorrência.");
  }
  let next = { ...data };
  if (createIncident && !a.incidentId) {
    const incidentId = id();
    a = { ...a, incidentId };
    next.incidents = [
      ...data.incidents,
      {
        id: incidentId,
        title: a.title,
        store: a.store,
        openedOn: a.date,
        status: a.status === "Concluído" ? "Pendente" : a.status,
        ticket: a.ticket,
        events: [
          {
            id: id(),
            date: a.date,
            at: new Date().toISOString(),
            text: activityDescription(a) || a.title,
            status: a.status === "Concluído" ? "Pendente" : a.status,
            activityId: a.id,
          },
        ],
      },
    ];
  } else if (a.incidentId && !data.activities.some((x) => x.id === a.id)) {
    next.incidents = data.incidents.map((i) =>
      i.id === a.incidentId
        ? updateIncident(i, {
            id: id(),
            date: a.date,
            at: new Date().toISOString(),
            text: activityDescription(a) || a.title,
            status: i.status,
            activityId: a.id,
          })
        : i,
    );
  }
  next.activities = saveActivity(data.activities, a);
  return next;
}
