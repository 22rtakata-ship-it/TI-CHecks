import { CalendarDays, ChartNoAxesCombined, PackageCheck } from "lucide-react";
import type { monthlyValidity } from "../selectors";

export function ValiditySummary({
  metrics,
  month,
  currentDate,
}: {
  metrics: ReturnType<typeof monthlyValidity>;
  month: string;
  currentDate: string;
}) {
  const latestDate = metrics.latest?.date.split("-").reverse().join("/");
  return (
    <div className="validity-summary">
      <div className="panel">
        <CalendarDays size={19} />
        <div>
          <strong>
            {metrics.recordedDueDays}/{metrics.expectedDays}
          </strong>
          <span>
            Dias úteis preenchidos{" "}
            {month < currentDate.slice(0, 7) ? "no mês" : "até hoje"}
          </span>
        </div>
      </div>
      <div className="panel">
        <PackageCheck size={19} />
        <div>
          <strong>{metrics.pendingDates.length}</strong>
          <span>
            Dias sem preenchimento{" "}
            {month < currentDate.slice(0, 7) ? "no mês" : "até hoje"}
          </span>
        </div>
      </div>
      <div className="panel">
        <ChartNoAxesCombined size={19} />
        <div>
          <strong>{latestDate || "—"}</strong>
          <span>Último registro do mês selecionado</span>
        </div>
      </div>
    </div>
  );
}
