import type { TitlePreset } from "./types";

export const TITLE_PRESET_NAME_LIMIT = 100;
export const ACTIVITY_TITLE_LIMIT = 180;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function nameKey(name: string) {
  return normalizeName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/** Validate an entire snapshot without rewriting names or unknown properties. */
export function validateTitlePresets(value: unknown): TitlePreset[] {
  if (!Array.isArray(value))
    throw new Error("A lista de títulos padrão é inválida.");
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const preset of value) {
    if (
      !preset ||
      typeof preset !== "object" ||
      typeof preset.id !== "string" ||
      !uuidPattern.test(preset.id) ||
      typeof preset.name !== "string"
    )
      throw new Error("Um título padrão possui dados inválidos.");
    const name = normalizeName(preset.name);
    if (!name) throw new Error("Informe o nome do título padrão.");
    if (name.length > TITLE_PRESET_NAME_LIMIT)
      throw new Error(
        `O título padrão deve ter até ${TITLE_PRESET_NAME_LIMIT} caracteres.`,
      );
    const key = nameKey(name);
    if (ids.has(preset.id.toLowerCase()) || names.has(key))
      throw new Error("Já existe um título padrão com esse nome ou código.");
    ids.add(preset.id.toLowerCase());
    names.add(key);
  }
  return value as TitlePreset[];
}

export function saveTitlePreset(
  items: readonly TitlePreset[],
  preset: TitlePreset,
): TitlePreset[] {
  const saved = { ...preset, name: normalizeName(preset.name) };
  const exists = items.some((item) => item.id === saved.id);
  const next = exists
    ? items.map((item) => (item.id === saved.id ? saved : item))
    : [...items, saved];
  return validateTitlePresets(next);
}

export function removeTitlePreset(
  items: readonly TitlePreset[],
  presetId: string,
): TitlePreset[] {
  if (!items.some((item) => item.id === presetId))
    throw new Error("Título padrão não encontrado.");
  return items.filter((item) => item.id !== presetId);
}

/** Store the complete title as text so deleting a preset never alters history. */
export function composeActivityTitle(
  presetName: string,
  detail: string,
): string {
  const prefix = normalizeName(presetName);
  const suffix = detail.trim();
  if (!suffix) throw new Error("Preencha o título da atividade.");
  const title = prefix ? `${prefix} - ${suffix}` : suffix;
  if (title.length > ACTIVITY_TITLE_LIMIT)
    throw new Error(
      `O título completo deve ter até ${ACTIVITY_TITLE_LIMIT} caracteres.`,
    );
  return title;
}
