import type { Activity } from "@/types/domain";
import { stores } from "@/lib/date";
import type { DashboardMetrics } from "./types";

export function ActivityDistributions({
  metrics,
  allVisibleActivities,
  month,
  store,
}: {
  metrics: DashboardMetrics;
  allVisibleActivities: Activity[];
  month: string;
  store: string;
}) {
  const r = metrics.report;
  return (
    <div className="dashboard-split dashboard-distributions">
      <section className="panel" aria-labelledby="categories-chart-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="categories-chart-title">Atividades por categoria</h2>
          </div>
          <span>{r.activities.length} no total</span>
        </div>
        {metrics.categories.length ? (
          metrics.categories.map(([category, count]) => (
            <div className="dashboard-bar-row" key={category}>
              <div>
                <span>{category}</span>
                <b>
                  {count}
                  <small>
                    {Math.round((count / r.activities.length) * 100)}%
                  </small>
                </b>
              </div>
              <progress
                value={count}
                max={r.activities.length}
                aria-label={`${category}: ${count} atividades`}
              />
            </div>
          ))
        ) : (
          <p className="dashboard-description">
            Nenhuma atividade registrada neste mês e loja.
          </p>
        )}
      </section>
      <section className="panel" aria-labelledby="stores-chart-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="stores-chart-title">Atividades por loja</h2>
          </div>
          <span>Mesmo mês · todas as lojas</span>
        </div>
        {[
          ...new Set([...stores, ...allVisibleActivities.map((a) => a.store)]),
        ].map((name) => {
          const count = allVisibleActivities.filter(
            (a) => a.store === name && a.date.startsWith(month),
          ).length;
          const total = allVisibleActivities.filter((a) =>
            a.date.startsWith(month),
          ).length;
          return (
            <div
              className={`dashboard-bar-row ${name === store ? "selected-store" : ""}`}
              key={name}
            >
              <div>
                <span>
                  {name}
                  {name === store && <small>Loja selecionada</small>}
                </span>
                <b>{count}</b>
              </div>
              <progress
                value={count}
                max={total || 1}
                aria-label={`${name}: ${count} atividades`}
              />
            </div>
          );
        })}
        <p className="dashboard-footnote">
          Indicadores calculados dos registros. Atividades, ocorrências e
          checklists têm contagens independentes.
        </p>
      </section>
    </div>
  );
}
