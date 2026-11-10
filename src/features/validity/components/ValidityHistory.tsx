import type { monthlyValidity } from "../selectors";
import { validityMetrics } from "../metrics";
import { formatValidityNumber as number } from "../formatters";

export function ValidityHistory({
  metrics,
  month,
  store,
  currentDate,
  onOpenDay,
}: {
  metrics: ReturnType<typeof monthlyValidity>;
  month: string;
  store: string;
  currentDate: string;
  onOpenDay?: (date: string) => void;
}) {
  const rows = [
    ...metrics.series,
    ...metrics.legacyRecords.map((record) => ({
      date: record.date,
      record,
      expired: record.expired,
      atRisk: record.atRisk,
      unlinked: record.unlinked,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section
      className="panel validity-history"
      aria-labelledby="validity-history-title"
    >
      <h2 id="validity-history-title">Histórico por dia</h2>
      <p className="form-hint">
        “Não preenchido” é diferente de zero. Dias futuros permanecem
        programados. Consulte ou corrija as quantidades no diário.
      </p>
      <div className="validity-table-scroll">
        <table>
          <caption className="validity-sr-only">
            Validades de {store} em {month.split("-").reverse().join("/")}
          </caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              {validityMetrics.map((metric) => (
                <th scope="col" key={metric.key}>
                  {metric.label}
                </th>
              ))}
              <th scope="col">Situação</th>
              {onOpenDay && <th scope="col">Diário</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => (
              <tr
                key={day.date}
                className={!day.record ? "validity-unfilled-row" : ""}
              >
                <th scope="row">
                  <time dateTime={day.date}>
                    {day.date.split("-").reverse().join("/")}
                  </time>
                </th>
                {validityMetrics.map((metric) => (
                  <td key={metric.key}>
                    {day[metric.key] === null ? "—" : number(day[metric.key]!)}
                  </td>
                ))}
                <td>
                  {day.record
                    ? metrics.legacyRecords.some(
                        (record) => record.date === day.date,
                      )
                      ? "Registro anterior · fora da rotina"
                      : "Preenchido"
                    : day.date > currentDate
                      ? "Programado"
                      : "Não preenchido"}
                </td>
                {onOpenDay && (
                  <td>
                    <button
                      className="text-button"
                      aria-label={`Abrir validades de ${day.date.split("-").reverse().join("/")}`}
                      onClick={() => onOpenDay(day.date)}
                    >
                      Ver dia →
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {metrics.legacyRecords.length > 0 && (
        <p className="form-hint">
          Registros anteriores fora de dias úteis foram preservados para
          consulta e não entram na comparação da rotina de segunda a sexta.
        </p>
      )}
    </section>
  );
}
