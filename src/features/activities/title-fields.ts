import type { Activity } from "./types";
import type { TitlePreset } from "@/features/settings/title-presets/types";
import { composeActivityTitle } from "@/features/settings/title-presets/service";

export interface ActivityTitleDraft {
  presetId?: string;
  prefix?: string;
  detail: string;
}

/** Historical prefixes come from the record, never from the current catalog. */
export function initialActivityTitle(activity?: Activity): ActivityTitleDraft {
  if (
    activity?.titlePresetId &&
    activity.titlePrefix &&
    activity.titleDetail !== undefined
  ) {
    try {
      if (
        composeActivityTitle(activity.titlePrefix, activity.titleDetail) ===
        activity.title
      )
        return {
          presetId: activity.titlePresetId,
          prefix: activity.titlePrefix,
          detail: activity.titleDetail,
        };
    } catch {
      // Older clients can edit the full title without updating new metadata.
    }
  }
  return { detail: activity?.title || "" };
}

export function selectActivityTitlePreset(
  draft: ActivityTitleDraft,
  preset?: TitlePreset,
): ActivityTitleDraft {
  return {
    detail: draft.detail,
    presetId: preset?.id,
    prefix: preset?.name,
  };
}

export function activityTitleForSave(draft: ActivityTitleDraft) {
  const title = composeActivityTitle(draft.prefix || "", draft.detail);
  return {
    title,
    titlePresetId: draft.prefix ? draft.presetId : undefined,
    titlePrefix: draft.prefix || undefined,
    titleDetail: draft.prefix ? draft.detail.trim() : undefined,
  };
}
