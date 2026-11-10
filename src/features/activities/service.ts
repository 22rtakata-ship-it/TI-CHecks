import type { Activity, AppData } from "@/types/domain";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

/** Pesquisa o histórico da loja sem alterar a ordem dos registros originais. */
export function searchActivities(
  activities: readonly Activity[],
  store: string,
  query = "",
): Activity[] {
  const text = normalizeSearchText(query);
  const ticketText = text.replace(/^(?:chamado|ticket)\s*:?\s*/, "");
  // Só normaliza dígitos quando a busca representa um número de chamado.
  // Uma pesquisa como "PDV 3" continua sendo uma pesquisa textual.
  const ticketDigits = /^[#\d\s./-]+$/.test(ticketText)
    ? ticketText.replace(/\D/g, "")
    : "";

  return activities
    .filter((activity) => {
      if (activity.deletedAt || activity.store !== store) return false;
      if (!text) return true;
      const matchesText = [
        activity.title,
        activity.category,
        activity.ticket,
      ].some((value) => normalizeSearchText(value).includes(text));
      return (
        matchesText ||
        Boolean(
          ticketDigits &&
          activity.ticket.replace(/\D/g, "").includes(ticketDigits),
        )
      );
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.createdAt.localeCompare(a.createdAt) ||
        a.id.localeCompare(b.id),
    );
}

export function validateActivity(a: Activity) {
  if (!a.title.trim() || !a.date || !a.store || !a.category)
    throw new Error("Preencha título, data, loja e categoria.");
  if (a.minutes !== undefined && (!Number.isFinite(a.minutes) || a.minutes < 0))
    throw new Error("O tempo deve ser um número positivo.");
  return a;
}
export function saveActivity(items: Activity[], a: Activity) {
  validateActivity(a);
  const old = items.find((x) => x.id === a.id);
  return [
    ...items.filter((x) => x.id !== a.id),
    {
      ...a,
      revisions: old
        ? [
            ...old.revisions,
            {
              at: new Date().toISOString(),
              title: old.title,
              status: old.status,
            },
          ]
        : [],
    },
  ];
}

/** Removal preserves links, evidence and history so it can be safely restored. */
export function removeActivity(
  data: AppData,
  activityId: string,
  removedAt = new Date().toISOString(),
): AppData {
  if (!data.activities.some((activity) => activity.id === activityId))
    throw new Error("Atividade não encontrada.");
  return {
    ...data,
    activities: data.activities.map((activity) =>
      activity.id === activityId && !activity.deletedAt
        ? { ...activity, deletedAt: removedAt }
        : activity,
    ),
  };
}

export function restoreActivity(data: AppData, activityId: string): AppData {
  if (!data.activities.some((activity) => activity.id === activityId))
    throw new Error("Atividade não encontrada.");
  return {
    ...data,
    activities: data.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      const { deletedAt, ...restored } = activity;
      return restored;
    }),
  };
}
