import type { ChecklistStatus } from "@/types/domain";
import { weekdayLabel } from "@/lib/date";
import { Empty, Modal } from "@/components/ui/shared";
import { checklistStates } from "./checklist-status";
import type { DashboardMetrics } from "./types";

export function ChecklistStatusDialog({
  selectedChecklistStatus,
  metrics,
  store,
  monthLabel,
  onClose,
  onOpenDay,
}: {
  selectedChecklistStatus: ChecklistStatus;
  metrics: DashboardMetrics;
  store: string;
  monthLabel: string;
  onClose: () => void;
  onOpenDay?: (date: string) => void;
}) {
  const selectedChecklistLabel = checklistStates.find(
    ([status]) => status === selectedChecklistStatus,
  )?.[1];
  const selectedChecklists = metrics.dueChecklists
    .filter((row) => row.status === selectedChecklistStatus)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "pt-BR"),
    );
  return (
    <Modal
      title={selectedChecklistLabel || selectedChecklistStatus}
      onClose={onClose}
    >
      <p className="form-hint">
        {store} · {monthLabel} · previstos até{" "}
        {metrics.cutoff.split("-").reverse().join("/")}
      </p>
      <div className="checklist-date-list">
        {selectedChecklists.length ? (
          selectedChecklists.map((row) => (
            <div
              className="checklist-date-row"
              key={`${row.templateId}:${row.date}:${row.store}`}
            >
              <div>
                <time dateTime={row.date}>
                  {row.date.split("-").reverse().join("/")} ·{" "}
                  {weekdayLabel(row.date)}
                </time>
                <strong>{row.name}</strong>
                <small>{row.store}</small>
              </div>
              {onOpenDay && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDay(row.date);
                  }}
                >
                  Ver dia
                </button>
              )}
            </div>
          ))
        ) : (
          <Empty title="Nenhum checklist nesta situação" />
        )}
      </div>
    </Modal>
  );
}
