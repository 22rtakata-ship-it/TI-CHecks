"use client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  ArrowUpRight,
  ListChecks,
  CircleDot,
} from "lucide-react";
import { ActivityCards } from "@/features/activities/ActivityCards";
import { visibleActivities } from "@/features/activities/visibility";
import { DailyValidity } from "@/features/validity/DailyValidity";
import type { AppData, Activity } from "@/types/domain";
import { formatDuration } from "@/lib/duration";
import { dayLabel, weekdayLabel, shiftDate, today } from "@/lib/date";
import { ChecklistPanel } from "@/features/checklists/ChecklistPanel";
import { IncidentPanel } from "@/features/incidents/IncidentPanel";
import { checklistMetrics } from "@/features/checklists/metrics";
import { planned } from "@/features/checklists/service";
import { statusOn } from "@/features/incidents/service";
import { SectionTitle } from "@/components/ui/shared";
// Preserve the original import path for existing consumers.
export { ActivityCards } from "@/features/activities/ActivityCards";

export function DailyLog({
  data,
  date,
  setDate,
  store,
  save,
  onNew,
  onEdit,
}: {
  data: AppData;
  date: string;
  setDate: (d: string) => void;
  store: string;
  save: (d: AppData) => Promise<void>;
  onNew: (incidentId?: string, checklistId?: string) => void;
  onEdit: (a: Activity) => void;
}) {
  const activities = visibleActivities(data)
    .filter((a) => a.date === date && a.store === store)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const checklists = planned(data.templates, data.executions, date, store);
  const checklistTotals = checklistMetrics(checklists);
  const pending = data.incidents
    .filter(
      (i) =>
        !i.deletedAt &&
        i.store === store &&
        i.openedOn <= date &&
        statusOn(i, date) !== "Concluído",
    )
    .map((i) => ({
      ...i,
      status: statusOn(i, date) || i.status,
      events: i.events.filter((e) => e.date <= date),
    }));
  return (
    <>
      <SectionTitle
        eyebrow="SEU ESPAÇO DE TRABALHO"
        title="Diário de atividades"
      >
        <button className="primary" onClick={() => onNew()}>
          <Plus size={17} /> Nova atividade
        </button>
      </SectionTitle>
      <p className="lead">
        Cada ação conta. Organize o hoje, acompanhe o que vem depois.
      </p>
      <div className="date-bar">
        <div className="calendar-tile">
          <CalendarDays size={24} />
        </div>
        <div className="grow">
          <h2>{dayLabel(date)}</h2>
          <span>
            {weekdayLabel(date)} <span className="date-dot">•</span>{" "}
            {date === today() ? "Hoje" : "Data selecionada"}
          </span>
        </div>
        <div className="date-controls">
          <button
            className="icon-button"
            aria-label="Dia anterior"
            onClick={() => setDate(shiftDate(date, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setDate(today())}>Hoje</button>
          <button
            className="icon-button"
            aria-label="Próximo dia"
            onClick={() => setDate(shiftDate(date, 1))}
          >
            <ChevronRight size={18} />
          </button>
          <input
            aria-label="Selecionar data"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
      </div>
      <div className="stats-grid compact">
        {[
          [activities.length, "Atividades no dia", CircleDot],
          [
            formatDuration(
              activities.reduce((n, a) => n + (a.minutes || 0), 0),
            ),
            "Tempo registrado",
            Clock3,
          ],
          [
            `${checklistTotals.completed}/${checklistTotals.applicable}`,
            "Checklists aplicáveis concluídos",
            ListChecks,
          ],
          [pending.length, "Ocorrências pendentes", ArrowUpRight],
        ].map(([n, l, Icon]) => {
          const I = Icon as typeof CircleDot;
          return (
            <div className="stat-card" key={String(l)}>
              <div>
                <span>{String(l)}</span>
                <strong>{String(n)}</strong>
              </div>
              <I size={22} />
            </div>
          );
        })}
      </div>
      <section className="panel">
        <ChecklistPanel
          data={data}
          date={date}
          store={store}
          save={save}
          onActivity={(id) => onNew(undefined, id)}
        />
      </section>
      <DailyValidity
        key={`${date}:${store}`}
        data={data}
        date={date}
        store={store}
        save={save}
      />
      <section className="spaced">
        <div className="section-heading">
          <h2>
            Atividades registradas{" "}
            <span className="count">{activities.length}</span>
          </h2>
          <span className="subtle">Em ordem cronológica</span>
        </div>
        <ActivityCards activities={activities} onEdit={onEdit} />
      </section>
      <section className="spaced">
        <div className="section-heading">
          <h2>
            Ocorrências em acompanhamento{" "}
            <span className="count">{pending.length}</span>
          </h2>
        </div>
        <p className="form-hint">
          Pendências de outros dias não são contabilizadas como atividades de
          hoje.
        </p>
        <IncidentPanel
          data={data}
          incidents={pending}
          save={save}
          onActivity={(id) => onNew(id)}
        />
      </section>
    </>
  );
}
