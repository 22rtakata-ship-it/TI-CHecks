import type { AppData } from "@/types/domain";

export function normalizeWorkspace(data: unknown): AppData {
  const snapshot = data as Partial<AppData> | null;
  const sections = [
    "activities",
    "incidents",
    "templates",
    "executions",
    "evidence",
    "categories",
  ] as const;
  if (
    !snapshot ||
    snapshot.version !== 1 ||
    sections.some((section) => !Array.isArray(snapshot[section])) ||
    (snapshot.validityRecords !== undefined &&
      !Array.isArray(snapshot.validityRecords))
  )
    throw new Error(
      "Dados incompatíveis. Nenhum registro foi substituído; preserve sua cópia de segurança.",
    );
  return {
    ...snapshot,
    validityRecords: snapshot.validityRecords ?? [],
  } as AppData;
}
