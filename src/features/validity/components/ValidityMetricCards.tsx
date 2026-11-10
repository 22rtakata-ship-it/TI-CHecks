import type { monthlyValidity } from "../selectors";
import { validityMetrics } from "../metrics";
import { formatValidityNumber as number, trendLabel } from "../formatters";

export function ValidityMetricCards({
  metrics,
}: {
  metrics: ReturnType<typeof monthlyValidity>;
}) {
  const firstDate = metrics.first?.date.split("-").reverse().join("/");
  const latestDate = metrics.latest?.date.split("-").reverse().join("/");
  return (
    <div className="validity-metric-cards">
      {validityMetrics.map((metric) => (
        <section
          className={`panel validity-metric-card ${metric.className}`}
          key={metric.key}
          aria-label={metric.label}
        >
          <span className="validity-metric-label">
            <i />
            {metric.label}
          </span>
          <strong>
            {metrics.latest ? number(metrics.latest[metric.key]) : "—"}
          </strong>
          <small>
            {latestDate
              ? `Última quantidade · ${latestDate}`
              : "Sem quantidade informada"}
          </small>
          <p
            className={`validity-trend ${metrics.trends[metric.key].direction}`}
          >
            {trendLabel(metrics.trends[metric.key])}
          </p>
          {metrics.first && (
            <small>
              Primeiro registro: {number(metrics.first[metric.key])} em{" "}
              {firstDate}.
            </small>
          )}
        </section>
      ))}
    </div>
  );
}
