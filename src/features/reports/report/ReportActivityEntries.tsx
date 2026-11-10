import { Badge } from "@/components/ui/shared";
import { activityDescription } from "@/features/activities/description";
import type { Activity, Evidence } from "@/types/domain";
import { technicalActivityFields } from "./technical-fields";

export function ReportActivityEntries({
  activities,
  mode,
}: {
  activities: Activity[];
  evidence: Evidence[];
  mode: string;
}) {
  return (
    <>
      {activities.length ? (
        activities.map((a) => (
          <section className="report-entry" key={a.id}>
            {mode === "Técnico" ? (
              <>
                <time dateTime={a.date}>
                  {a.date.split("-").reverse().join("/")}
                </time>
                <dl className="report-technical-fields">
                  {technicalActivityFields(a).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                <strong>
                  {a.date.split("-").reverse().join("/")} · {a.title}
                </strong>
                <Badge>{a.status}</Badge>
                <p>
                  {a.description === undefined
                    ? a.result || a.procedure || "Resultado não informado."
                    : activityDescription(a) || "Descrição não informada."}
                </p>
              </>
            )}
          </section>
        ))
      ) : (
        <p>Não há atividades registradas neste período e filtro.</p>
      )}
    </>
  );
}
