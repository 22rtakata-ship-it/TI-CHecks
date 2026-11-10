"use client";

import { useId } from "react";
import { today } from "@/lib/date";
import type { monthlyValidity } from "../selectors";
import { validityMetrics } from "../metrics";
import {
  formatValidityNumber as number,
  compactValidityNumber as compact,
} from "../formatters";

export function EvolutionChart({
  metrics,
}: {
  metrics: ReturnType<typeof monthlyValidity>;
}) {
  const chartId = useId();
  const width = Math.max(650, metrics.series.length * 38 + 60);
  const top = 22,
    bottom = 220,
    left = 48;
  const rawMax = Math.max(
    1,
    ...metrics.series.flatMap((day) =>
      validityMetrics.map((metric) => day[metric.key] ?? 0),
    ),
  );
  const step = Math.max(1, Math.ceil(rawMax / 4));
  const axisMax = step * 4;
  const groupWidth = (width - left - 14) / Math.max(1, metrics.series.length);
  const barWidth = Math.min(8, (groupWidth - 8) / 3);
  return (
    <figure className="validity-evolution">
      <figcaption id={chartId}>
        <strong>Quantidade registrada em cada dia útil</strong>
        <span>
          Compare as três situações ao longo do mês. Passe sobre uma barra para
          consultar o valor.
        </span>
      </figcaption>
      <div className="validity-chart-scroll">
        <svg
          className="validity-chart"
          role="img"
          aria-labelledby={chartId}
          aria-describedby={`${chartId}-description`}
          viewBox={`0 0 ${width} 262`}
          style={{ minWidth: width }}
        >
          <desc id={`${chartId}-description`}>
            Barras agrupadas por dia útil: vencidas, em risco e não vinculados.
            Uma marca tracejada indica dia sem preenchimento, sem assumir
            quantidade zero. Os valores também estão na tabela abaixo.
          </desc>
          {[0, 1, 2, 3, 4].map((index) => {
            const value = index * step,
              y = bottom - (value / axisMax) * (bottom - top);
            return (
              <g key={value}>
                <line
                  x1={left}
                  y1={y}
                  x2={width - 10}
                  y2={y}
                  className="validity-gridline"
                />
                <text
                  x={left - 9}
                  y={y + 4}
                  textAnchor="end"
                  className="validity-axis-label"
                >
                  {compact.format(value)}
                </text>
              </g>
            );
          })}
          {metrics.series.map((day, index) => {
            const x = left + index * groupWidth + groupWidth / 2;
            return (
              <g key={day.date}>
                {day.record ? (
                  validityMetrics.map((metric, metricIndex) => {
                    const value = day[metric.key]!;
                    const height = (value / axisMax) * (bottom - top);
                    const barX =
                      x - 1.5 * barWidth + metricIndex * (barWidth + 1);
                    if (value === 0)
                      return (
                        <circle
                          key={metric.key}
                          className={`validity-bar ${metric.className}`}
                          cx={barX + barWidth / 2}
                          cy={bottom}
                          r={2}
                        >
                          <title>
                            {day.date.split("-").reverse().join("/")} ·{" "}
                            {metric.label}: 0
                          </title>
                        </circle>
                      );
                    return (
                      <rect
                        key={metric.key}
                        className={`validity-bar ${metric.className}`}
                        x={barX}
                        y={bottom - height}
                        width={barWidth}
                        height={height}
                        rx={2}
                      >
                        <title>
                          {day.date.split("-").reverse().join("/")} ·{" "}
                          {metric.label}: {number(value)}
                        </title>
                      </rect>
                    );
                  })
                ) : (
                  <g>
                    <line
                      x1={x}
                      x2={x}
                      y1={top + 12}
                      y2={bottom}
                      className="validity-gap-line"
                    />
                    <text
                      x={x}
                      y={bottom - 8}
                      textAnchor="middle"
                      className="validity-gap-label"
                    >
                      —
                    </text>
                    <title>
                      {day.date.split("-").reverse().join("/")} ·{" "}
                      {day.date > today()
                        ? "Programado, sem registro"
                        : "Não preenchido"}
                    </title>
                  </g>
                )}
                <text
                  x={x}
                  y={bottom + 19}
                  textAnchor="middle"
                  className="validity-axis-label"
                >
                  {day.date.slice(-2)}
                </text>
              </g>
            );
          })}
          <text
            x={(width + left) / 2}
            y={bottom + 39}
            textAnchor="middle"
            className="validity-axis-label"
          >
            Dia do mês
          </text>
        </svg>
      </div>
      <div className="validity-legend">
        {validityMetrics.map((metric) => (
          <span key={metric.key}>
            <i className={metric.className} />
            {metric.label}
          </span>
        ))}
        <span>
          <i className="missing" />
          Não preenchido
        </span>
      </div>
    </figure>
  );
}
