import { Activity, Clock3 } from "lucide-react";
import { formatDuration } from "@/lib/duration";
import type { DashboardMetrics } from "./types";

export function ActivityMetrics({
  report: r,
  currentDate,
  isCurrentMonth,
}: {
  report: DashboardMetrics["report"];
  currentDate: string;
  isCurrentMonth: boolean;
}) {
  const completedActivities = r.activities.filter(
    (a) => a.status === "Concluído",
  ).length;
  const timedActivities = r.activities.filter(
    (a) => a.minutes !== undefined,
  ).length;
  return (
    <section
      className="panel dashboard-activity-panel"
      aria-labelledby="activity-metrics-title"
    >
      <div className="dashboard-section-heading">
        <div>
          <Activity size={18} />
          <h2 id="activity-metrics-title">Atividades realizadas</h2>
        </div>
        <span>Registros do mês selecionado</span>
      </div>
      <div className="dashboard-activity-metrics">
        <div className="dashboard-number">
          <span>Atividades no mês</span>
          <strong>{r.activities.length}</strong>
          <small>
            {isCurrentMonth
              ? `${r.activities.filter((a) => a.date === currentDate).length} registradas hoje`
              : "Cada intervenção conta uma atividade"}
          </small>
        </div>
        <div className="dashboard-number">
          <span>Atividades concluídas</span>
          <strong>{completedActivities}</strong>
          <small>
            {r.activities.length - completedActivities} com execução em
            acompanhamento
          </small>
        </div>
        <div className="dashboard-number dashboard-time">
          <span>
            <Clock3 size={15} /> Tempo registrado
          </span>
          <strong>{formatDuration(r.minutes)}</strong>
          <small>
            {timedActivities} de {r.activities.length} atividades com tempo
            informado
          </small>
        </div>
      </div>
    </section>
  );
}
