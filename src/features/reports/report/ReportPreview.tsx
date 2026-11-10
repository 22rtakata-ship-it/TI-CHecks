import { formatDuration } from "@/lib/duration";
import type { Evidence } from "@/types/domain";
import { reportMonthLabel } from "../calendar";
import { ReportActivityEntries } from "./ReportActivityEntries";
import { ReportIncidentSections } from "./ReportIncidentSections";
import type { PdfTheme, ReportData } from "./types";

export function ReportPreview({
  report: r,
  month,
  store,
  mode,
  pdfTheme,
  text,
  evidence,
  onSummaryChange,
}: {
  report: ReportData;
  month: string;
  store: string;
  mode: string;
  pdfTheme: PdfTheme;
  text: string;
  evidence: Evidence[];
  onSummaryChange: (summary: string) => void;
}) {
  return (
    <article className="panel report" data-pdf-theme={pdfTheme}>
      <div className="eyebrow">TI LOG / {mode.toUpperCase()}</div>
      <h2>Relatório de atividades de TI</h2>
      <p>
        {reportMonthLabel(month)} · Loja {store}
      </p>
      <h3>Resumo executivo</h3>
      <textarea
        className="no-print"
        aria-label="Resumo executivo editável"
        rows={6}
        value={text}
        onChange={(e) => onSummaryChange(e.target.value)}
      />
      <p className="print-only">{text}</p>
      <div className="report-stats">
        <span>
          <b>{r.activities.length}</b> atividades
        </span>
        <span>
          <b>{formatDuration(r.minutes)}</b> tempo registrado
        </span>
        <span>
          <b>{r.applicable ? `${r.completed}/${r.applicable}` : "—"}</b>{" "}
          checklists aplicáveis
        </span>
        <span>
          <b>{r.resolved.length}</b> ocorrências resolvidas
        </span>
        <span>
          <b>{r.pending.length}</b> pendências
        </span>
      </div>
      <h3>
        {mode === "Técnico"
          ? "Atividades — registros técnicos"
          : "Entregas registradas"}
      </h3>
      <ReportActivityEntries
        activities={r.activities}
        evidence={evidence}
        mode={mode}
      />
      <h3>Checklists</h3>
      <p>
        {r.applicable
          ? `${r.execution}% de execução: ${r.completed} de ${r.applicable} checklists aplicáveis.`
          : "Nenhum checklist aplicável ao período."}{" "}
        Os {r.notApplicable} não aplicáveis ficam fora do percentual.
      </p>
      {["A fazer", "Concluído", "Não concluído", "Não se aplica"].map((s) => (
        <p key={s}>
          {s}: {r.checklists.filter((c) => c.status === s).length}
        </p>
      ))}
      <ReportIncidentSections
        resolved={r.resolved}
        pending={r.pending}
        month={month}
      />
      <h3>Considerações finais</h3>
      <p>
        Este relatório utiliza exclusivamente registros do sistema. Campos sem
        preenchimento não representam serviços executados. A identificação
        automática de problemas recorrentes será adicionada em uma próxima
        versão.
      </p>
    </article>
  );
}
