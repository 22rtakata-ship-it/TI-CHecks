import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { searchActivities } from "@/features/activities/service";
import { initialData } from "@/lib/seed";
import type { Activity } from "@/types/domain";

const store = "295 — Itatiba";
const otherStore = "178 — Indaiatuba";
const activity: Activity = {
  id: "a",
  date: "2027-01-08",
  createdAt: "2027-01-08T13:00:00Z",
  store,
  title: "Religamento das TVs do açougue",
  category: "TVs e monitores",
  sector: "Açougue",
  equipment: "TV",
  problem: "",
  procedure: "Religadas",
  result: "Funcionando",
  notes: "",
  status: "Concluído",
  ticket: "",
  nextAction: "",
  dependency: "",
  followUp: "",
  revisions: [],
};

describe("Pesquisa do histórico de atividades", () => {
  it.each([
    "1233542",
    "#1233542",
    " # 123 3542 ",
    "123-3542",
    "123.3542",
    "Chamado #123-3542",
    "3542",
  ])("encontra o chamado com a pesquisa %s", (query) => {
    const match = { ...activity, ticket: "1233542" };
    expect(searchActivities([match], store, query)).toEqual([match]);
  });

  it("normaliza também a formatação do chamado armazenado", () => {
    const match = { ...activity, ticket: "# 123-3542" };
    expect(searchActivities([match], store, "1233542")).toEqual([match]);
  });

  it("pesquisa título sem depender de acentos, caixa ou espaços repetidos", () => {
    expect(searchActivities([activity], store, "TVs   DO ACOUGUE")).toEqual([
      activity,
    ]);
  });

  it("pesquisa por categoria e preserva atividades sem chamado", () => {
    const mobile = { ...activity, id: "mobile", category: "Celulares" };
    expect(searchActivities([activity, mobile], store, "CELULARES")).toEqual([
      mobile,
    ]);
    expect(searchActivities([activity], store, "religamento")).toEqual([
      activity,
    ]);
  });

  it("restringe os resultados à loja selecionada mesmo com o mesmo chamado", () => {
    const local = { ...activity, ticket: "1233542" };
    const remote = { ...local, id: "remote", store: otherStore };
    expect(searchActivities([remote, local], store, "1233542")).toEqual([
      local,
    ]);
  });

  it("não interpreta números de uma pesquisa textual como chamados", () => {
    const pdv = { ...activity, title: "Reparo do PDV 3", ticket: "7654321" };
    const unrelated = { ...activity, id: "unrelated", ticket: "1233542" };
    expect(searchActivities([unrelated, pdv], store, "PDV 3")).toEqual([pdv]);
  });

  it("lista os mais recentes primeiro sem modificar o array recebido", () => {
    const lastDate = { ...activity, id: "latest", date: "2027-01-09" };
    const lastTime = {
      ...activity,
      id: "time",
      createdAt: "2027-01-08T14:00:00Z",
    };
    const sameTime = { ...activity, id: "b" };
    const input = [sameTime, activity, lastTime, lastDate];
    expect(searchActivities(input, store).map((item) => item.id)).toEqual([
      "latest",
      "time",
      "a",
      "b",
    ]);
    expect(input).toEqual([sameTime, activity, lastTime, lastDate]);
    expect(searchActivities(input, store, "   ")).toEqual(
      searchActivities(input, store),
    );
  });

  it("retorna lista vazia quando nenhuma atividade corresponde à pesquisa", () => {
    expect(searchActivities([activity], store, "9876543")).toEqual([]);
  });
});

describe("Categoria Celulares", () => {
  it("faz parte das categorias iniciais uma única vez", () => {
    expect(
      initialData().categories.filter((name) => name === "Celulares"),
    ).toHaveLength(1);
  });

  it("migra categorias existentes sem duplicar, perder personalizações ou revisões", async () => {
    const db = new PGlite();
    const migration = readFileSync(
      "supabase/migrations/202611070001_add_mobile_category.sql",
      "utf8",
    );
    try {
      await db.exec(`
        create table public.workspace_settings (
          owner_id text primary key,
          categories jsonb not null,
          revision bigint not null,
          updated_at timestamptz not null default '2026-01-01T00:00:00Z'
        );
        insert into public.workspace_settings(owner_id,categories,revision) values
          ('custom', '["Coletores", "Telefonia própria"]', 12),
          ('empty', '[]', 0),
          ('existing', '["Impressoras", "celulares"]', 8),
          ('spaced', '[" CELULARES ", "Categoria personalizada"]', 4);
      `);
      await db.exec(migration);
      type Settings = {
        owner_id: string;
        categories: string[];
        revision: number;
        updated_at: string;
      };
      const select = `
        select owner_id,categories,revision::int,updated_at::text
        from public.workspace_settings order by owner_id
      `;
      const first = (await db.query<Settings>(select)).rows;
      expect(
        first.map(({ owner_id, categories, revision }) => ({
          owner_id,
          categories,
          revision,
        })),
      ).toEqual([
        {
          owner_id: "custom",
          categories: ["Coletores", "Telefonia própria", "Celulares"],
          revision: 13,
        },
        { owner_id: "empty", categories: ["Celulares"], revision: 1 },
        {
          owner_id: "existing",
          categories: ["Impressoras", "celulares"],
          revision: 8,
        },
        {
          owner_id: "spaced",
          categories: [" CELULARES ", "Categoria personalizada"],
          revision: 4,
        },
      ]);
      expect(first[0].updated_at).not.toBe(first[2].updated_at);
      await db.exec(migration);
      expect((await db.query<Settings>(select)).rows).toEqual(first);
    } finally {
      await db.close();
    }
  }, 20000);
});
