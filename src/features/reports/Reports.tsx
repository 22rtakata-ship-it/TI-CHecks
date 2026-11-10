"use client";

import { useState } from "react";
import type { AppData } from "@/types/domain";
import { monthlyReport } from "./selectors";
import { reportSummary } from "./summary";
import { SectionTitle } from "@/components/ui/shared";
import { today } from "@/lib/date";
import { ReportFilters } from "./report/ReportFilters";
import { ReportExportActions } from "./report/ReportExportActions";
import { ReportPreview } from "./report/ReportPreview";
import { usePdfTheme } from "./report/usePdfTheme";
import { useReportExport } from "./report/useReportExport";
import "./reports.css";

export function Reports({
  data,
  initialStore,
}: {
  data: AppData;
  initialStore: string;
}) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [store, setStore] = useState(initialStore);
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("Gerencial");
  const [summary, setSummary] = useState("");
  const { pdfTheme, selectPdfTheme } = usePdfTheme();
  const r = monthlyReport(data, month, store, category);
  const text = summary || reportSummary(r, month, store);
  const { notice, busy, downloadSpreadsheet, copyEmailText } = useReportExport({
    data,
    month,
    store,
    category,
    text,
    pending: r.pending,
  });

  return (
    <div className="reports-page">
      <SectionTitle eyebrow="DOCUMENTAÇÃO" title="Relatórios mensais" />
      <ReportFilters
        month={month}
        store={store}
        category={category}
        categories={data.categories}
        mode={mode}
        pdfTheme={pdfTheme}
        onMonthChange={(value) => {
          setMonth(value);
          setSummary("");
        }}
        onStoreChange={(value) => {
          setStore(value);
          setSummary("");
        }}
        onCategoryChange={(value) => {
          setCategory(value);
          setSummary("");
        }}
        onModeChange={setMode}
        onPdfThemeChange={selectPdfTheme}
      />
      <ReportExportActions
        busy={busy}
        notice={notice}
        onSpreadsheet={downloadSpreadsheet}
        onCopyEmail={copyEmailText}
      />
      <ReportPreview
        report={r}
        month={month}
        store={store}
        mode={mode}
        pdfTheme={pdfTheme}
        text={text}
        evidence={data.evidence}
        onSummaryChange={setSummary}
      />
    </div>
  );
}
