import { Copy, Download, Printer } from "lucide-react";

export function ReportExportActions({
  busy,
  notice,
  onSpreadsheet,
  onCopyEmail,
}: {
  busy: boolean;
  notice: string;
  onSpreadsheet: () => Promise<void>;
  onCopyEmail: () => Promise<void>;
}) {
  return (
    <>
      <div className="export-bar no-print">
        <button onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / salvar PDF
        </button>
        <button disabled={busy} onClick={onSpreadsheet}>
          <Download size={16} /> Exportar XLSX
        </button>
        <button onClick={onCopyEmail}>
          <Copy size={16} /> Texto para e-mail
        </button>
      </div>
      {notice && (
        <p className="no-print" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
