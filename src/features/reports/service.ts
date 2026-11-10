// Public compatibility facade; each concern stays in its own module.
export { monthlyReport, dashboardMetrics } from "./selectors";
export { reportSummary } from "./summary";
export { createReportWorkbook } from "./workbook";
export { exportSpreadsheet } from "./export";
