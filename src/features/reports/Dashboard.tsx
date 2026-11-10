"use client";

import { useState } from "react";
import type { AppData, ChecklistStatus } from "@/types/domain";
import { dashboardMetrics } from "./selectors";
import { visibleActivities } from "@/features/activities/visibility";
import { today } from "@/lib/date";
import { Field, SectionTitle } from "@/components/ui/shared";
import { ActivityMetrics } from "./dashboard/ActivityMetrics";
import { IncidentMetrics } from "./dashboard/IncidentMetrics";
import { ChecklistMetrics } from "./dashboard/ChecklistMetrics";
import { ActivityDistributions } from "./dashboard/ActivityDistributions";
import { ChecklistStatusDialog } from "./dashboard/ChecklistStatusDialog";
import "./reports.css";

export function Dashboard({
  data,
  store,
  onOpenDay,
}: {
  data: AppData;
  store: string;
  onOpenDay?: (date: string) => void;
}) {
  const currentDate = today();
  const [month, setMonth] = useState(currentDate.slice(0, 7));
  const [selectedChecklistStatus, setSelectedChecklistStatus] =
    useState<ChecklistStatus | null>(null);
  const allVisibleActivities = visibleActivities(data);
  const metrics = dashboardMetrics(data, month, store, currentDate);
  const isCurrentMonth = month === currentDate.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="VISÃO GERAL" title="Seu trabalho em números">
        <Field label="Mês do dashboard">
          <input
            type="month"
            required
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setSelectedChecklistStatus(null);
              }
            }}
          />
        </Field>
      </SectionTitle>
      <p className="lead dashboard-context">
        {store} <span aria-hidden="true">·</span> {monthLabel}
      </p>
      <ActivityMetrics
        report={metrics.report}
        currentDate={currentDate}
        isCurrentMonth={isCurrentMonth}
      />
      <div className="dashboard-split">
        <IncidentMetrics metrics={metrics} />
        <ChecklistMetrics
          metrics={metrics}
          month={month}
          currentDate={currentDate}
          onSelectStatus={setSelectedChecklistStatus}
        />
      </div>
      <ActivityDistributions
        metrics={metrics}
        allVisibleActivities={allVisibleActivities}
        month={month}
        store={store}
      />
      {selectedChecklistStatus && (
        <ChecklistStatusDialog
          selectedChecklistStatus={selectedChecklistStatus}
          metrics={metrics}
          store={store}
          monthLabel={monthLabel}
          onClose={() => setSelectedChecklistStatus(null)}
          onOpenDay={onOpenDay}
        />
      )}
    </div>
  );
}
