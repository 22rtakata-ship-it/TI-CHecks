import type { ValidityRecord } from "./types";
import { isValidityDay } from "./calendar";
import { validityMetrics } from "./metrics";

export function validateValidity(record: ValidityRecord): ValidityRecord {
  if (!record.id.trim() || !record.store.trim())
    throw new Error(
      "Informe a loja e a identificação do registro de validades.",
    );
  if (!isValidityDay(record.date))
    throw new Error(
      "As validades devem ser registradas de segunda a sexta-feira.",
    );
  for (const metric of validityMetrics) {
    const value = record[metric.key];
    if (!Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647)
      throw new Error(
        `${metric.label}: informe uma quantidade inteira entre 0 e 2.147.483.647.`,
      );
  }
  if (!Number.isFinite(new Date(record.updatedAt).getTime()))
    throw new Error("A data de atualização do registro é inválida.");
  return record;
}

export function saveValidityRecord(
  records: readonly ValidityRecord[],
  entry: ValidityRecord,
): ValidityRecord[] {
  validateValidity(entry);
  if (
    records.some(
      (record) =>
        record.id === entry.id &&
        (record.date !== entry.date || record.store !== entry.store),
    )
  )
    throw new Error(
      "Este identificador já pertence a outro registro de validades.",
    );
  const existing = records.find(
    (record) => record.date === entry.date && record.store === entry.store,
  );
  const record = { ...entry, id: existing?.id || entry.id };
  return [
    ...records.filter(
      (item) => item.date !== entry.date || item.store !== entry.store,
    ),
    record,
  ];
}
