import { describe, expect, it } from "vitest";
import type { TitlePreset } from "@/types/domain";
import { initialData } from "@/lib/seed";
import { normalizeWorkspace } from "@/lib/workspace-data";
import {
  composeActivityTitle,
  removeTitlePreset,
  saveTitlePreset,
  validateTitlePresets,
} from "@/features/settings/title-presets/service";

const machine: TitlePreset = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Máquina ADM",
};
const printer: TitlePreset = {
  id: "20000000-0000-4000-8000-000000000002",
  name: "Impressora",
};

describe("Catálogo de títulos padrão", () => {
  it("normaliza o nome, cria e edita sem duplicar ou alterar o original", () => {
    const input = [printer];
    const added = saveTitlePreset(input, {
      ...machine,
      name: "  Máquina   ADM  ",
    });
    expect(input).toEqual([printer]);
    expect(added).toEqual([printer, machine]);
    const edited = saveTitlePreset(added, {
      ...machine,
      name: "Máquina dos cartazes",
    });
    expect(edited).toEqual([
      printer,
      { ...machine, name: "Máquina dos cartazes" },
    ]);
    expect(added).toEqual([printer, machine]);
  });

  it.each([
    "maquina adm",
    " MÁQUINA   ADM ",
    "máquina\tADM",
    "Ma\u0301quina ADM",
  ])("impede nome repetido ignorando case, acentos e espaços: %s", (name) => {
    expect(() => saveTitlePreset([machine], { ...printer, name })).toThrow(
      /Já existe/,
    );
  });

  it.each(["", " \n\t ", "a".repeat(101)])(
    "rejeita nome vazio ou excessivo",
    (name) => {
      expect(() => saveTitlePreset([], { ...machine, name })).toThrow();
    },
  );

  it("aceita o limite e impede códigos inválidos ou duplicados no snapshot", () => {
    expect(
      saveTitlePreset([], { ...machine, name: "a".repeat(100) }),
    ).toHaveLength(1);
    expect(() => validateTitlePresets([{ ...machine, id: "" }])).toThrow();
    expect(() =>
      validateTitlePresets([machine, { ...printer, id: machine.id }]),
    ).toThrow();
    for (const value of [null, {}, "", [null], [1], [{ id: machine.id }]])
      expect(() => validateTitlePresets(value)).toThrow();
  });

  it("remove só o modelo e não modifica o catálogo original", () => {
    const items = [machine, printer];
    expect(removeTitlePreset(items, machine.id)).toEqual([printer]);
    expect(items).toEqual([machine, printer]);
    expect(() => removeTitlePreset(items, "missing")).toThrow(/não encontrado/);
  });
});

describe("Título completo da atividade", () => {
  it("compõe o prefixo e o complemento do exemplo e permite título livre", () => {
    expect(
      composeActivityTitle(" Máquina  ADM ", " Cartazista fonte queimada "),
    ).toBe("Máquina ADM - Cartazista fonte queimada");
    expect(composeActivityTitle("", " TV religada ")).toBe("TV religada");
    expect(() => composeActivityTitle(machine.name, " \n ")).toThrow(
      /Preencha/,
    );
  });

  it("limita os 180 caracteres considerando também o prefixo", () => {
    expect(composeActivityTitle("ADM", "a".repeat(174))).toHaveLength(180);
    expect(() => composeActivityTitle("ADM", "a".repeat(175))).toThrow(/180/);
    expect(() => composeActivityTitle("", "a".repeat(181))).toThrow(/180/);
  });
});

describe("Compatibilidade do snapshot", () => {
  it("normaliza clientes legados sem catálogo e preserva propriedades e títulos antigos", () => {
    const legacy = { ...initialData(), customMetadata: { preserved: true } };
    delete legacy.titlePresets;
    const normalized = normalizeWorkspace(legacy);
    expect(normalized.titlePresets).toEqual([]);
    expect(normalized).toMatchObject({ customMetadata: { preserved: true } });
    expect(legacy).not.toHaveProperty("titlePresets");
  });

  it("valida o catálogo recebido sem reescrever o payload", () => {
    const preset = { ...machine, customProperty: "preserved" };
    const snapshot = { ...initialData(), titlePresets: [preset] };
    expect(normalizeWorkspace(snapshot).titlePresets).toEqual([preset]);
    for (const value of [
      null,
      {},
      [null],
      [machine, { ...printer, name: "maquina adm" }],
    ])
      expect(() =>
        normalizeWorkspace({ ...snapshot, titlePresets: value }),
      ).toThrow(/incompatíveis/);
  });
});
