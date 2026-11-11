import { Field } from "@/components/ui/shared";
import type { TitlePreset } from "@/features/settings/title-presets/types";
import { ACTIVITY_TITLE_LIMIT } from "@/features/settings/title-presets/service";
import type { Activity } from "./types";
import {
  initialActivityTitle,
  selectActivityTitlePreset,
  type ActivityTitleDraft,
} from "./title-fields";
import "./title-fields.css";

const savedChoice = "saved-title-prefix";
const draftChoice = "selected-title-prefix";

export function ActivityTitleFields({
  presets,
  existing,
  draft,
  onChange,
  disabled,
}: {
  presets: TitlePreset[];
  existing?: Activity;
  draft: ActivityTitleDraft;
  onChange: (draft: ActivityTitleDraft) => void;
  disabled: boolean;
}) {
  const saved = initialActivityTitle(existing);
  const isSaved =
    !!saved.prefix &&
    draft.prefix === saved.prefix &&
    draft.presetId === saved.presetId;
  const currentPreset = presets.find(
    (preset) => preset.id === draft.presetId && preset.name === draft.prefix,
  );
  const selected = !draft.prefix
    ? ""
    : isSaved
      ? savedChoice
      : currentPreset?.id || draftChoice;
  const preview = draft.prefix
    ? `${draft.prefix} - ${draft.detail.trim() || "…"}`
    : draft.detail.trim();

  return (
    <>
      <Field label="Título padrão">
        <select
          name="titlePreset"
          value={selected}
          disabled={disabled}
          onChange={(event) => {
            const value = event.target.value;
            if (value === savedChoice)
              onChange({ ...saved, detail: draft.detail });
            else if (value !== draftChoice)
              onChange(
                selectActivityTitlePreset(
                  draft,
                  presets.find((preset) => preset.id === value),
                ),
              );
          }}
        >
          <option value="">Sem título padrão</option>
          {saved.prefix && (
            <option value={savedChoice}>{saved.prefix} (título salvo)</option>
          )}
          {draft.prefix && !isSaved && !currentPreset && (
            <option value={draftChoice}>{draft.prefix} (selecionado)</option>
          )}
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={
          draft.prefix ? "Complemento do título *" : "Título da atividade *"
        }
      >
        <input
          name="title"
          autoFocus
          required
          maxLength={ACTIVITY_TITLE_LIMIT}
          placeholder={
            draft.prefix
              ? "Ex.: Cartazista fonte queimada"
              : "Ex.: Religamento das TVs do açougue"
          }
          value={draft.detail}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...draft, detail: event.target.value })
          }
        />
      </Field>
      {draft.prefix && (
        <p
          className="form-hint activity-title-preview"
          role="status"
          aria-label="Título final"
        >
          <strong>Título final: </strong>
          {preview}
        </p>
      )}
    </>
  );
}
