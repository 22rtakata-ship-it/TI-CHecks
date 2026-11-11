import { useState } from "react";
import type { AppData, Incident } from "@/types/domain";
import { exportSpreadsheet } from "../export";
import { reportMonthLabel } from "../calendar";

export function useReportExport({
  data,
  month,
  store,
  category,
  text,
  pending,
}: {
  data: AppData;
  month: string;
  store: string;
  category: string;
  text: string;
  pending: Incident[];
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function downloadSpreadsheet() {
    setBusy(true);
    try {
      await exportSpreadsheet(data, month, store, category);
      setNotice("Planilha gerada.");
    } catch {
      setNotice("Não foi possível gerar a planilha.");
    } finally {
      setBusy(false);
    }
  }

  async function copyEmailText() {
    try {
      await navigator.clipboard.writeText(
        `Relatório TI Diário — ${reportMonthLabel(month)}\n${text}\nPendências: ${pending.map((i) => i.title).join("; ") || "Nenhuma registrada."}`,
      );
      setNotice("Texto para e-mail copiado.");
    } catch {
      setNotice("Não foi possível copiar. Selecione o texto da prévia.");
    }
  }
  return { notice, busy, downloadSpreadsheet, copyEmailText };
}
