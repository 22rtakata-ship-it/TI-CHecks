import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Activity } from "@/types/domain";
import { ActivityTitleFields } from "@/features/activities/ActivityTitleFields";
import {
  activityTitleForSave,
  initialActivityTitle,
  selectActivityTitlePreset,
} from "@/features/activities/title-fields";
import { searchActivities } from "@/features/activities/service";

const preset = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Máquina ADM",
};
const activity: Activity = {
  id: "activity",
  date: "2026-11-11",
  createdAt: "2026-11-11T12:00:00Z",
  store: "295 — Itatiba",
  title: "Máquina ADM - Cartazista fonte queimada",
  description: "Fonte verificada",
  category: "Computadores",
  sector: "Administrativo",
  equipment: "ADM 1",
  problem: "Fonte queimada",
  procedure: "Verificação",
  result: "Aguardando peça",
  notes: "Registro anterior",
  status: "Pendente",
  ticket: "INC2219456",
  nextAction: "Trocar fonte",
  dependency: "Fornecedor",
  followUp: "2026-11-12",
  revisions: [],
};
const saved: Activity = {
  ...activity,
  titlePresetId: preset.id,
  titlePrefix: preset.name,
  titleDetail: "Cartazista fonte queimada",
};

describe("Formulário com títulos padrão e snapshots históricos", () => {
  it("mantém o título legado inteiro como texto livre sem inferir prefixo pelo hífen", () => {
    expect(initialActivityTitle(activity)).toEqual({ detail: activity.title });
    const html = renderToStaticMarkup(
      createElement(ActivityTitleFields, {
        presets: [preset],
        existing: activity,
        draft: initialActivityTitle(activity),
        onChange: () => {},
        disabled: false,
      }),
    );
    expect(html).toContain("Título da atividade *");
    expect(html).toContain(`value="${activity.title}"`);
    expect(html).toContain(
      '<option value="" selected="">Sem título padrão</option>',
    );
  });

  it("compõe o título inteiro pesquisável preservando todos os outros campos", () => {
    const draft = selectActivityTitlePreset(
      { detail: "Cartazista fonte queimada" },
      preset,
    );
    const record = { ...activity, ...activityTitleForSave(draft) };
    expect(record).toEqual(saved);
    expect(searchActivities([record], activity.store, "maquina adm")).toEqual([
      record,
    ]);
    expect(searchActivities([record], activity.store, "cartazista")).toEqual([
      record,
    ]);
    expect(activity).not.toHaveProperty("titlePresetId");
  });

  it.each([
    { scenario: "removido", presets: [] },
    {
      scenario: "renomeado",
      presets: [{ ...preset, name: "Máquinas administrativas" }],
    },
  ])(
    "não renomeia o título salvo ao editar quando o padrão foi $scenario",
    ({ presets }) => {
      const draft = initialActivityTitle(saved);
      expect(activityTitleForSave(draft)).toEqual({
        title: saved.title,
        titlePresetId: saved.titlePresetId,
        titlePrefix: saved.titlePrefix,
        titleDetail: saved.titleDetail,
      });
      const html = renderToStaticMarkup(
        createElement(ActivityTitleFields, {
          presets,
          existing: saved,
          draft,
          onChange: () => {},
          disabled: false,
        }),
      );
      expect(html).toContain('value="saved-title-prefix" selected=""');
      expect(html).toContain("Máquina ADM (título salvo)");
      expect(html).toContain("Complemento do título *");
      expect(html).toContain(saved.title);
    },
  );

  it("permite trocar o padrão ou voltar ao texto livre sem perder o complemento", () => {
    const draft = initialActivityTitle(saved);
    const changed = selectActivityTitlePreset(draft, {
      id: "20000000-0000-4000-8000-000000000002",
      name: "Máquina de cartazes",
    });
    expect(activityTitleForSave(changed).title).toBe(
      "Máquina de cartazes - Cartazista fonte queimada",
    );
    const free = activityTitleForSave(selectActivityTitlePreset(draft));
    expect(free).toEqual({
      title: "Cartazista fonte queimada",
      titlePresetId: undefined,
      titlePrefix: undefined,
      titleDetail: undefined,
    });
    expect(draft.detail).toBe(saved.titleDetail);
  });

  it("preserva o título editado por cliente antigo quando o snapshot não corresponde mais ao texto", () => {
    const externallyChanged = {
      ...saved,
      title: "Título corrigido em outra versão",
    };
    expect(initialActivityTitle(externallyChanged)).toEqual({
      detail: externallyChanged.title,
    });
    expect(initialActivityTitle({ ...saved, titleDetail: "" })).toEqual({
      detail: saved.title,
    });
  });

  it("rejeita o título completo longo sem truncar nem alterar o rascunho", () => {
    const draft = selectActivityTitlePreset(
      { detail: "x".repeat(180) },
      preset,
    );
    const before = structuredClone(draft);
    expect(() => activityTitleForSave(draft)).toThrow(/180/);
    expect(draft).toEqual(before);
  });
});
