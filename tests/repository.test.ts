import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialData } from "@/lib/seed";
const storage = { getItem: vi.fn(), setItem: vi.fn() };
async function repository(client: { rpc: ReturnType<typeof vi.fn> } | null) {
  vi.resetModules();
  vi.doMock("@/lib/supabase", () => ({ supabase: client }));
  return import("@/lib/repository");
}
beforeEach(() => {
  vi.clearAllMocks();
  storage.getItem.mockReturnValue(null);
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock("@/lib/supabase");
});
describe("Persistência explícita local/remota", () => {
  it("normaliza registros antigos sem validades tanto localmente como na nuvem", async () => {
    const legacy = { ...initialData() } as Partial<
      ReturnType<typeof initialData>
    >;
    delete legacy.validityRecords;
    storage.getItem.mockReturnValue(JSON.stringify(legacy));
    let r = await repository(null);
    expect((await r.loadData()).validityRecords).toEqual([]);
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { revision: 7, data: legacy }, error: null });
    r = await repository({ rpc });
    expect((await r.loadData("owner")).validityRecords).toEqual([]);
  });
  it("rejeita validades malformadas sem liberar salvamento com dados incompletos", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        revision: 7,
        data: { ...initialData(), validityRecords: null },
      },
      error: null,
    });
    const r = await repository({ rpc });
    await expect(r.loadData("owner")).rejects.toThrow(/incompatíveis/);
    await expect(r.persistData(initialData(), "owner")).rejects.toThrow(
      /Recarregue/,
    );
  });

  it("preserva a demonstração e exige ação explícita para importar em conta vazia", async () => {
    const demo = initialData();
    demo.categories = ["Categoria local"];
    storage.getItem.mockReturnValue(JSON.stringify(demo));
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: 1, error: null });
    const r = await repository({ rpc });
    expect(await r.loadData("owner")).toEqual(initialData());
    expect(r.canImportLocalDemo("owner")).toBe(true);
    expect(r.readLocalDemoData()).toEqual(demo);
    expect(rpc).toHaveBeenCalledTimes(1);
    await r.persistData(demo, "owner");
    expect(r.canImportLocalDemo("owner")).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("salva no navegador somente no modo de demonstração", async () => {
    const r = await repository(null);
    expect(await r.loadData()).toEqual(initialData());
    await r.persistData(initialData());
    expect(storage.setItem).toHaveBeenCalledWith(
      "ti-log-demo-v1",
      JSON.stringify(initialData()),
    );
  });
  it("sem sessão não recai em armazenamento local quando Supabase está configurado", async () => {
    const rpc = vi.fn();
    const r = await repository({ rpc });
    await expect(r.loadData()).rejects.toThrow(/sessão/);
    await expect(r.persistData(initialData())).rejects.toThrow(/sessão/);
    expect(rpc).not.toHaveBeenCalled();
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("erro remoto não grava localmente nem anuncia sucesso", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { revision: 2, data: initialData() },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("Conexão indisponível"),
      });
    const r = await repository({ rpc });
    await r.loadData("owner");
    await expect(r.persistData(initialData(), "owner")).rejects.toThrow(
      /indisponível/,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("confirma revisões sucessivas e mantém revisões separadas por conta", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: { revision: 4, data: initialData() },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { revision: 12, data: initialData() },
        error: null,
      })
      .mockResolvedValueOnce({ data: 5, error: null })
      .mockResolvedValueOnce({ data: 13, error: null });
    const r = await repository({ rpc });
    await r.loadData("a");
    await r.loadData("b");
    await r.persistData(initialData(), "a");
    await r.persistData(initialData(), "b");
    expect(rpc.mock.calls[2][1].expected_revision).toBe(4);
    expect(rpc.mock.calls[3][1].expected_revision).toBe(12);
  });
  it("não salva um documento sem carregar a conta e não aceita confirmação ausente", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const r = await repository({ rpc });
    await expect(r.persistData(initialData(), "owner")).rejects.toThrow(
      /Recarregue/,
    );
    await r.loadData("owner");
    await expect(r.persistData(initialData(), "owner")).rejects.toThrow(
      /não confirmou/,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
