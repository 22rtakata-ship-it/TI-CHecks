import { resolutionDate, statusOn } from "@/features/incidents/service";
import type { Incident } from "@/types/domain";
import { monthEnd } from "../calendar";
import { reportValue } from "./technical-fields";

export function ReportIncidentSections({
  resolved,
  pending,
  month,
}: {
  resolved: Incident[];
  pending: Incident[];
  month: string;
}) {
  const cutoff = monthEnd(month);
  return (
    <section className="report-incidents" aria-label="Ocorrências do período">
      <h3>Ocorrências</h3>
      <div className="report-incident-columns">
        <section aria-label="Ocorrências concluídas no mês">
          <h4>Concluídas no mês ({resolved.length})</h4>
          {resolved.length ? (
            <ul>
              {resolved.map((incident) => {
                const date = resolutionDate(incident, cutoff);
                return (
                  <li key={incident.id}>
                    <strong>{reportValue(incident.title)}</strong>
                    <span>
                      Concluída em:{" "}
                      {date ? (
                        <time dateTime={date}>
                          {date.split("-").reverse().join("/")}
                        </time>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Nenhuma ocorrência concluída neste mês.</p>
          )}
        </section>
        <section aria-label="Ocorrências pendentes ao final do período">
          <h4>Pendentes ao final do período ({pending.length})</h4>
          {pending.length ? (
            <ul>
              {pending.map((incident) => (
                <li key={incident.id}>
                  <strong>{reportValue(incident.title)}</strong>
                  <span>Status: {reportValue(statusOn(incident, cutoff))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma ocorrência pendente ao final deste período.</p>
          )}
        </section>
      </div>
    </section>
  );
}
