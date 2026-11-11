import type { AppData } from "@/types/domain";
import { validateTitlePresets } from "@/features/settings/title-presets/service";

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
      !Array.isArray(snapshot.validityRecords)) ||
    (snapshot.titlePresets !== undefined &&
      !Array.isArray(snapshot.titlePresets))
  )
    throw new Error(
      "Dados incompatíveis. Nenhum registro foi substituído; preserve sua cópia de segurança.",
    );
  try {
    validateTitlePresets(snapshot.titlePresets ?? []);
  } catch {
    throw new Error(
      "Dados incompatíveis. Os títulos padrão são inválidos; nenhum registro foi substituído.",
    );
  }
  return {
    ...snapshot,
    validityRecords: snapshot.validityRecords ?? [],
    titlePresets: snapshot.titlePresets ?? [],
  } as AppData;
}
