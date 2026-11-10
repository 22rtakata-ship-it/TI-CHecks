import { shiftDate, today } from "@/lib/date";
import type { ValidityMetric, ValidityRecord, ValidityTrend } from "./types";
import { isCivilDate, isValidityDay } from "./calendar";
import { validityMetrics } from "./metrics";

export function monthlyValidity(
  records: readonly ValidityRecord[],
  month: string,
  store: string,
  referenceDate = today(),
) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Selecione um mês válido.");
  const start = `${month}-01`;
  const last = new Date(`${start}T12:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const end = last.toISOString().slice(0, 10);
  const selected = records.filter(
    (record) =>
      record.store === store &&
      record.date.startsWith(`${month}-`) &&
      isCivilDate(record.date),
  );
  const byDate = new Map<string, ValidityRecord>();
  for (const record of selected) {
    const current = byDate.get(record.date);
    if (
      !current ||
      record.updatedAt > current.updatedAt ||
      (record.updatedAt === current.updatedAt && record.id > current.id)
    )
      byDate.set(record.date, record);
  }
  const series: {
    date: string;
    record: ValidityRecord | null;
    expired: number | null;
    atRisk: number | null;
    unlinked: number | null;
  }[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    if (!isValidityDay(date)) continue;
    const record = byDate.get(date) || null;
    series.push({
      date,
      record,
      expired: record?.expired ?? null,
      atRisk: record?.atRisk ?? null,
      unlinked: record?.unlinked ?? null,
    });
  }
  const filled = series
    .filter((day) => day.record !== null)
    .map((day) => day.record!);
  const first = filled.at(0) || null;
  const latest = filled.at(-1) || null;
  const dueDays = series.filter((day) => day.date <= referenceDate);
  const pendingDates = dueDays
    .filter((day) => day.record === null)
    .map((day) => day.date);
  const trends = Object.fromEntries(
    validityMetrics.map(({ key }) => {
      const initial = first?.[key] ?? null;
      const current = latest?.[key] ?? null;
      const comparable = filled.length >= 2;
      const change = comparable ? current! - initial! : null;
      const reductionPercent =
        comparable && initial! > 0
          ? Math.round(((initial! - current!) / initial!) * 1000) / 10
          : null;
      const direction = !comparable
        ? "insufficient"
        : change! < 0
          ? "down"
          : change! > 0
            ? "up"
            : "stable";
      return [
        key,
        {
          initial,
          latest: current,
          change,
          reductionPercent,
          direction,
        } satisfies ValidityTrend,
      ];
    }),
  ) as Record<ValidityMetric, ValidityTrend>;
  return {
    start,
    end,
    series,
    first,
    latest,
    trends,
    recordedDays: filled.length,
    recordedDueDays: dueDays.length - pendingDates.length,
    expectedDays: dueDays.length,
    pendingDates,
    legacyRecords: [...byDate.values()]
      .filter((record) => !isValidityDay(record.date))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
