import { describe, expect, it } from "vitest";
import {
  isValidityDay,
  monthlyValidity,
  saveValidityRecord,
  validateValidity,
} from "@/features/validity/service";
import type { ValidityRecord } from "@/features/validity/types";
const store = "295 — Itatiba";
const record: ValidityRecord = {
  id: "r1",
  date: "2026-11-02",
  store,
  expired: 10,
  atRisk: 20,
  unlinked: 5,
  updatedAt: "2026-11-02T13:00:00Z",
};

describe("Registro diário de validades", () => {
  it("programa apenas segunda a sexta e rejeita datas inexistentes", () => {
    expect(isValidityDay("2026-11-02")).toBe(true);
    expect(isValidityDay("2026-11-06")).toBe(true);
    expect(isValidityDay("2026-11-07")).toBe(false);
    expect(isValidityDay("2026-11-08")).toBe(false);
    expect(isValidityDay("2026-02-30")).toBe(false);
    expect(isValidityDay("não é data")).toBe(false);
  });
  it("aceita três quantidades zero como preenchimento real", () => {
    expect(
      validateValidity({ ...record, expired: 0, atRisk: 0, unlinked: 0 }),
    ).toEqual({ ...record, expired: 0, atRisk: 0, unlinked: 0 });
  });
  it.each([-1, 1.5, NaN, Infinity, 2_147_483_648])(
    "rejeita quantidade inválida %s",
    (value) => {
      expect(() => validateValidity({ ...record, expired: value })).toThrow(
        /inteira/,
      );
    },
  );
  it("rejeita loja vazia e novo registro em fim de semana", () => {
    expect(() => validateValidity({ ...record, store: " " })).toThrow(/loja/);
    expect(() => validateValidity({ ...record, date: "2026-11-07" })).toThrow(
      /segunda a sexta/,
    );
  });
  it("atualiza sem duplicar modelo data/loja e mantém identificação anterior", () => {
    const second = { ...record, id: "r2", store: "178 — Indaiatuba" };
    const input = [record, second];
    const saved = saveValidityRecord(input, {
      ...record,
      id: "novo-id",
      expired: 2,
      updatedAt: "2026-11-02T14:00:00Z",
    });
    expect(saved).toHaveLength(2);
    expect(saved.find((r) => r.store === store)).toEqual({
      ...record,
      expired: 2,
      updatedAt: "2026-11-02T14:00:00Z",
    });
    expect(input).toEqual([record, second]);
  });
  it("não permite reutilizar um identificador em outra data", () => {
    expect(() =>
      saveValidityRecord([record], { ...record, date: "2026-11-03" }),
    ).toThrow(/identificador/);
  });
});

describe("Evolução mensal de validades", () => {
  it("filtra loja e mês e diferencia dias ausentes de quantidades zero", () => {
    const zero = {
      ...record,
      id: "zero",
      date: "2026-11-04",
      expired: 0,
      atRisk: 0,
      unlinked: 0,
    };
    const data = [
      record,
      zero,
      { ...record, id: "other", store: "178 — Indaiatuba", expired: 999 },
      { ...record, id: "oct", date: "2026-10-30", expired: 999 },
    ];
    const metrics = monthlyValidity(data, "2026-11", store, "2026-11-06");
    expect(metrics.series).toHaveLength(21);
    expect(
      metrics.series.find((d) => d.date === "2026-11-03")?.expired,
    ).toBeNull();
    expect(metrics.series.find((d) => d.date === "2026-11-04")?.expired).toBe(
      0,
    );
    expect(metrics.series.find((d) => d.date === "2026-11-07")).toBeUndefined();
    expect(metrics.recordedDays).toBe(2);
    expect(metrics.recordedDueDays).toBe(2);
    expect(metrics.expectedDays).toBe(5);
    expect(metrics.pendingDates).toEqual([
      "2026-11-03",
      "2026-11-05",
      "2026-11-06",
    ]);
    expect(metrics.latest).toEqual(zero);
    expect(data).toHaveLength(4);
  });
  it("compara primeiro/último snapshots sem somá-los", () => {
    const end = {
      ...record,
      id: "end",
      date: "2026-11-06",
      expired: 4,
      atRisk: 25,
      unlinked: 5,
    };
    const metrics = monthlyValidity(
      [end, record],
      "2026-11",
      store,
      "2026-11-06",
    );
    expect(metrics.first).toEqual(record);
    expect(metrics.latest).toEqual(end);
    expect(metrics.trends.expired).toEqual({
      initial: 10,
      latest: 4,
      change: -6,
      reductionPercent: 60,
      direction: "down",
    });
    expect(metrics.trends.atRisk).toEqual({
      initial: 20,
      latest: 25,
      change: 5,
      reductionPercent: -25,
      direction: "up",
    });
    expect(metrics.trends.unlinked.direction).toBe("stable");
  });
  it("não inventa evolução ou porcentagem com um só registro ou base zero", () => {
    const one = monthlyValidity([record], "2026-11", store, "2026-11-06");
    expect(one.trends.expired.change).toBeNull();
    expect(one.trends.expired.direction).toBe("insufficient");
    const zero = { ...record, expired: 0 };
    const end = { ...record, id: "end", date: "2026-11-06", expired: 3 };
    const two = monthlyValidity([zero, end], "2026-11", store, "2026-11-06");
    expect(two.trends.expired.change).toBe(3);
    expect(two.trends.expired.reductionPercent).toBeNull();
  });
  it("não transforma ausência de todos os registros em zero", () => {
    const metrics = monthlyValidity([], "2026-11", store, "2026-11-01");
    expect(metrics.first).toBeNull();
    expect(metrics.latest).toBeNull();
    expect(metrics.expectedDays).toBe(0);
    expect(metrics.recordedDays).toBe(0);
    expect(metrics.trends.expired.latest).toBeNull();
    expect(metrics.series.every((d) => d.record === null)).toBe(true);
  });
  it("mantém dados legados de fim de semana consultáveis fora da evolução útil", () => {
    const legacy = { ...record, id: "legacy", date: "2026-11-07", expired: 99 };
    const metrics = monthlyValidity(
      [legacy, record],
      "2026-11",
      store,
      "2026-11-09",
    );
    expect(metrics.legacyRecords).toEqual([legacy]);
    expect(metrics.recordedDays).toBe(1);
    expect(metrics.latest).toEqual(record);
  });
  it("considera o mês inteiro como devido ao consultar um mês encerrado", () => {
    const metrics = monthlyValidity([record], "2026-11", store, "2026-12-02");
    expect(metrics.expectedDays).toBe(21);
    expect(metrics.recordedDueDays).toBe(1);
    expect(metrics.pendingDates).toHaveLength(20);
  });
  it("nenhum dia de mês futuro aparece como pendência", () => {
    const metrics = monthlyValidity([], "2026-12", store, "2026-11-09");
    expect(metrics.expectedDays).toBe(0);
    expect(metrics.pendingDates).toHaveLength(0);
  });
  it("rejeita mês inválido", () =>
    expect(() => monthlyValidity([], "2026-13", store)).toThrow(/mês/));
});
