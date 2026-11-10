import { Field } from "@/components/ui/shared";
import { stores } from "@/lib/date";
import type { PdfTheme } from "./types";

type ReportFiltersProps = {
  month: string;
  store: string;
  category: string;
  categories: string[];
  mode: string;
  pdfTheme: PdfTheme;
  onMonthChange: (month: string) => void;
  onStoreChange: (store: string) => void;
  onCategoryChange: (category: string) => void;
  onModeChange: (mode: string) => void;
  onPdfThemeChange: (theme: PdfTheme) => void;
};

export function ReportFilters({
  month,
  store,
  category,
  categories,
  mode,
  pdfTheme,
  onMonthChange,
  onStoreChange,
  onCategoryChange,
  onModeChange,
  onPdfThemeChange,
}: ReportFiltersProps) {
  return (
    <>
      <div className="panel filter-bar no-print">
        <Field label="Mês">
          <input
            type="month"
            required
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                onMonthChange(e.target.value);
              }
            }}
          />
        </Field>
        <Field label="Loja">
          <select
            value={store}
            onChange={(e) => {
              onStoreChange(e.target.value);
            }}
          >
            {stores.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Categoria das atividades">
          <select
            value={category}
            onChange={(e) => {
              onCategoryChange(e.target.value);
            }}
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Modelo">
          <select value={mode} onChange={(e) => onModeChange(e.target.value)}>
            <option>Gerencial</option>
            <option>Técnico</option>
          </select>
        </Field>
        <Field label="Tema do PDF">
          <select
            value={pdfTheme}
            onChange={(e) => {
              onPdfThemeChange(e.target.value as PdfTheme);
            }}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </Field>
      </div>
      <p className="form-hint no-print">
        Os indicadores de ocorrências e checklists são da loja inteira.
        Alterações de programação respeitam a data de vigência; históricos
        respondidos preservam nome e data. O tema escolhido aparece na prévia e
        no PDF.
      </p>
    </>
  );
}
