import type { monthlyReport } from "../selectors";

export type ReportData = ReturnType<typeof monthlyReport>;
export type PdfTheme = "light" | "dark";
