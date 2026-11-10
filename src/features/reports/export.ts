import type { AppData } from "@/types/domain";
import { createReportWorkbook } from "./workbook";

export async function exportSpreadsheet(
  data: AppData,
  month: string,
  store: string,
  category: string,
) {
  const book = await createReportWorkbook(data, month, store, category);
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `ti-log-${month}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
