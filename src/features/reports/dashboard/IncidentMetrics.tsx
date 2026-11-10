import { FolderClock } from "lucide-react";
import type { DashboardMetrics } from "./types";

export function IncidentMetrics({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <section className="panel" aria-labelledby="incident-metrics-title">
      <div className="dashboard-section-heading">
        <div>
          <FolderClock size={18} />
          <h2 id="incident-metrics-title">Ocorrências</h2>
        </div>
      </div>
      <p className="dashboard-description">
        Posição em {metrics.cutoff.split("-").reverse().join("/")}. Inclui
        problemas iniciados em meses anteriores.
      </p>
      <div className="dashboard-incident-totals">
        <div className="dashboard-number">
          <strong>{metrics.pending.length}</strong>
          <span>Em aberto</span>
        </div>
        <div className="dashboard-number">
          <strong>{metrics.resolved.length}</strong>
          <span>Resolvidas no mês</span>
        </div>
      </div>
      <div className="dashboard-detail-row">
        <span>Aguardando terceiros</span>
        <strong>{metrics.waiting.length}</strong>
      </div>
      <div className="dashboard-detail-row">
        <span>Demais ocorrências em aberto</span>
        <strong>{metrics.pending.length - metrics.waiting.length}</strong>
      </div>
      <p className="dashboard-footnote">
        Atualizações preservam uma única ocorrência. Pendências não entram na
        contagem de atividades.
      </p>
    </section>
  );
}
