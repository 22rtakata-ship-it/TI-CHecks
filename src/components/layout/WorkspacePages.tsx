"use client";

import { ActivitiesView } from "@/features/activities/ActivitiesView";
import { DailyLog } from "@/features/daily-log/DailyLog";
import { IncidentPanel } from "@/features/incidents/IncidentPanel";
import { TemplateManager } from "@/features/checklists/TemplateManager";
import { ValidityDashboard } from "@/features/validity/ValidityDashboard";
import { Dashboard } from "@/features/reports/Dashboard";
import { Reports } from "@/features/reports/Reports";
import { EvidencePanel } from "@/features/evidence/EvidencePanel";
import { Settings } from "@/features/settings/Settings";
import { SectionTitle } from "@/components/ui/shared";
import type { WorkspaceController } from "./useWorkspaceController";

type WorkspacePagesProps = {
  controller: Pick<
    WorkspaceController,
    | "page"
    | "data"
    | "date"
    | "setDate"
    | "store"
    | "save"
    | "newActivity"
    | "setForm"
    | "userId"
    | "openDay"
    | "restoreExistingActivity"
  >;
};

export function WorkspacePages({ controller }: WorkspacePagesProps) {
  const {
    page,
    data,
    date,
    setDate,
    store,
    save,
    newActivity,
    setForm,
    userId,
    openDay,
    restoreExistingActivity,
  } = controller;
  return (
    <>
      {page === "diario" && (
        <DailyLog
          data={data}
          date={date}
          setDate={setDate}
          store={store}
          save={save}
          onNew={newActivity}
          onEdit={(a) => setForm({ existing: a })}
        />
      )}
      {page === "dashboard" && (
        <Dashboard data={data} store={store} onOpenDay={openDay} />
      )}
      {page === "validades" && (
        <ValidityDashboard data={data} store={store} onOpenDay={openDay} />
      )}
      {page === "atividades" && (
        <ActivitiesView
          data={data}
          store={store}
          onNew={() => newActivity()}
          onEdit={(a) => setForm({ existing: a })}
          onRestore={restoreExistingActivity}
        />
      )}
      {page === "ocorrencias" && (
        <>
          <SectionTitle eyebrow="ACOMPANHAMENTO" title="Ocorrências">
            <button className="primary" onClick={() => newActivity()}>
              + Registrar problema
            </button>
          </SectionTitle>
          <p className="lead">
            Todo o histórico do problema, da identificação à resolução. Para
            abrir uma ocorrência, registre uma atividade e marque a opção de
            acompanhamento.
          </p>
          <IncidentPanel
            data={data}
            incidents={data.incidents.filter((i) => i.store === store)}
            showRemovalHistory
            save={save}
            onActivity={(id) => newActivity(id)}
          />
        </>
      )}
      {page === "checklists" && <TemplateManager data={data} save={save} />}
      {page === "evidencias" && (
        <EvidencePanel data={data} userId={userId} save={save} />
      )}
      {page === "relatorios" && <Reports data={data} initialStore={store} />}
      {page === "configuracoes" && <Settings data={data} save={save} />}
    </>
  );
}
