import type {
  ChecklistTemplate,
  ChecklistExecution,
  ChecklistStatus,
} from "@/types/domain";
export function templateOn(
  t: ChecklistTemplate,
  date: string,
): ChecklistTemplate {
  return t.history?.find((h) => date < h.until)?.schedule || t;
}
export function scheduled(template: ChecklistTemplate, date: string) {
  const t = templateOn(template, date);
  return (
    t.active &&
    (!t.start || date >= t.start) &&
    (!t.end || date <= t.end) &&
    (t.recurring
      ? t.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())
      : t.date === date)
  );
}
export function checklistKey(templateId: string, date: string, store: string) {
  return `${templateId}:${date}:${store}`;
}
export function planned(
  templates: ChecklistTemplate[],
  executions: ChecklistExecution[],
  date: string,
  store: string,
) {
  const saved = executions.filter((e) => e.date === date && e.store === store);
  return [
    ...saved.map((e) => ({
      templateId: e.templateId,
      name: e.name,
      status: e.status as ChecklistStatus,
      execution: e,
    })),
    ...templates
      .filter(
        (t) => scheduled(t, date) && !saved.some((e) => e.templateId === t.id),
      )
      .map((t) => ({
        templateId: t.id,
        name: templateOn(t, date).name,
        status: "A fazer" as ChecklistStatus,
        execution: undefined,
      })),
  ].map((row) => ({ ...row, date, store }));
}
export function saveExecution(
  items: ChecklistExecution[],
  entry: ChecklistExecution,
) {
  if (entry.status !== "Concluído" && !entry.reason.trim())
    throw new Error("Informe o motivo da não conclusão ou não aplicação.");
  return [
    ...items.filter(
      (e) =>
        checklistKey(e.templateId, e.date, e.store) !==
        checklistKey(entry.templateId, entry.date, entry.store),
    ),
    entry,
  ];
}

export function reviseTemplate(
  previous: ChecklistTemplate | undefined,
  next: ChecklistTemplate,
  effectiveFrom: string,
): ChecklistTemplate {
  if (!previous)
    return {
      ...next,
      start:
        next.start && next.start > effectiveFrom ? next.start : effectiveFrom,
    };
  const { history, ...schedule } = previous;
  const last = history?.at(-1)?.until;
  if (last && effectiveFrom < last)
    throw new Error(
      "A vigência não pode anteceder a última alteração de programação.",
    );
  return {
    ...next,
    history: [...(history || []), { until: effectiveFrom, schedule }],
  };
}
