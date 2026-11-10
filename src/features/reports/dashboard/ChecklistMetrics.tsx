import { CheckCheck } from "lucide-react";
import type { ChecklistStatus } from "@/types/domain";
import { checklistStates } from "./checklist-status";
import type { DashboardMetrics } from "./types";

export function ChecklistMetrics({
  metrics,
  month,
  currentDate,
  onSelectStatus,
}: {
  metrics: DashboardMetrics;
  month: string;
  currentDate: string;
  onSelectStatus: (status: ChecklistStatus) => void;
}) {
  const r = metrics.report;
  return (
    <section className="panel" aria-labelledby="checklist-metrics-title">
      <div className="dashboard-section-heading">
        <div>
          <CheckCheck size={18} />
          <h2 id="checklist-metrics-title">Checklists de rotina</h2>
        </div>
      </div>
      <div className="dashboard-checklist-progress">
        <strong>
          {metrics.applicable ? `${metrics.checklistPercent}%` : "—"}
        </strong>
        <span>
          {metrics.applicable ? (
            <>
              {metrics.completed} de {metrics.applicable} aplicáveis{" "}
              {month < currentDate.slice(0, 7) ? "no mês" : "até hoje"}
            </>
          ) : (
            "Nenhum checklist aplicável"
          )}
        </span>
      </div>
      <div
        className="dashboard-checklist-bar"
        role="img"
        aria-label={`Distribuição dos checklists: ${metrics.completed} concluídos e ${metrics.notApplicable} não aplicáveis, de ${metrics.dueChecklists.length} previstos até ${metrics.cutoff.split("-").reverse().join("/")}`}
      >
        {checklistStates.map(([status, label, color]) => {
          const count = metrics.dueChecklists.filter(
            (row) => row.status === status,
          ).length;
          return count ? (
            <span
              key={status}
              className={color}
              style={{
                width: `${(count / metrics.dueChecklists.length) * 100}%`,
              }}
              title={`${label}: ${count}`}
              aria-hidden="true"
            />
          ) : null;
        })}
      </div>
      <div className="dashboard-checklist-states">
        {checklistStates.map(([status, label, color]) => {
          const count = metrics.dueChecklists.filter(
            (c) => c.status === status,
          ).length;
          return (
            <button
              type="button"
              key={status}
              className={`dashboard-checklist-state ${color}`}
              disabled={!count}
              onClick={() => onSelectStatus(status)}
              aria-label={`${label}: ${count}`}
            >
              <span>{label}</span>
              <b>{count}</b>
            </button>
          );
        })}
      </div>
      <p className="dashboard-footnote dashboard-checklist-explanation">
        A barra mostra todos os previstos. O percentual considera apenas os
        aplicáveis; “Não se aplica” fica fora do cálculo. Clique em uma situação
        para consultar as datas.
      </p>
      <p className="dashboard-footnote">
        <strong>{r.checklists.length}</strong> previstos no mês
        {metrics.futureChecklists.length > 0 && (
          <>
            {" "}
            · <strong>{metrics.futureChecklists.length}</strong> programados
            para datas futuras, fora do percentual acima
          </>
        )}
        .
      </p>
    </section>
  );
}
