import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initialData } from "@/lib/seed";
import type { AppData } from "@/types/domain";

const owner = "10000000-0000-4000-8000-000000000001";
const otherOwner = "20000000-0000-4000-8000-000000000002";
const store = "295 — Itatiba";
let db: PGlite;

const preset = (name = "Máquina ADM") => ({ id: randomUUID(), name });
const document = (titlePresets: unknown = []) => ({
  ...initialData(),
  titlePresets,
});
async function asOwner(id = owner) {
  await db.exec(
    `reset role; set role authenticated; set request.jwt.claim.sub='${id}';`,
  );
}
async function save(snapshot: unknown, revision: number | null = 0) {
  const result = await db.query<{ revision: number }>(
    "select public.save_workspace($1::jsonb,$2::bigint) as revision",
    [JSON.stringify(snapshot), revision],
  );
  return Number(result.rows[0].revision);
}
async function load() {
  return (
    await db.query<{
      workspace: { revision: number; data: AppData } | null;
    }>("select public.load_workspace() as workspace")
  ).rows[0].workspace;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema auth,public,storage to authenticated;
    grant execute on function auth.uid() to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
  `);
  for (const file of readdirSync("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
}, 20000);
beforeEach(async () => {
  await db.exec(`reset role; delete from auth.users;
    insert into auth.users values ('${owner}'),('${otherOwner}');`);
  await asOwner();
});
afterAll(async () => {
  await db?.close();
});

describe("Títulos padrão no PostgreSQL", () => {
  it("salva, edita e remove o catálogo sem duplicar o modelo ou a configuração", async () => {
    const first = preset();
    const second = preset("Impressora de setor");
    expect(await save(document([first, second]))).toBe(1);
    expect((await load())?.data.titlePresets).toEqual([first, second]);
    const edited = { ...first, name: "Máquina administrativa" };
    expect(await save(document([edited, second]), 1)).toBe(2);
    expect((await load())?.data.titlePresets).toEqual([edited, second]);
    expect(await save(document([second]), 2)).toBe(3);
    expect((await load())?.data.titlePresets).toEqual([second]);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from public.workspace_settings",
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it("preserva títulos, campos legados, ocorrência, eventos, evidência e validades ao remover um modelo", async () => {
    const first = preset();
    const activityId = randomUUID();
    const incidentId = randomUUID();
    const activity = {
      id: activityId,
      date: "2026-11-11",
      createdAt: "2026-11-11T13:00:00.000Z",
      title: "Máquina ADM - Cartazista fonte queimada",
      titlePresetId: first.id,
      titlePrefix: first.name,
      titleDetail: "Cartazista fonte queimada",
      incidentId,
      store,
      status: "Pendente",
      category: "Computadores",
      equipment: "Estação cartazista",
      problem: "Sem alimentação",
      procedure: "Fonte verificada",
      result: "Aguardando substituição",
      notes: "Histórico anterior preservado",
      revisions: [
        {
          at: "2026-11-11T13:00:00.000Z",
          title: "Verificação ADM",
          status: "Em andamento",
        },
      ],
    };
    const incident = {
      id: incidentId,
      title: activity.title,
      store,
      openedOn: activity.date,
      status: "Pendente",
      ticket: "INC1401",
      events: [
        {
          id: randomUUID(),
          date: activity.date,
          at: activity.createdAt,
          text: activity.problem,
          status: "Pendente",
          activityId,
        },
      ],
    };
    const evidence = {
      id: randomUUID(),
      activityId,
      name: "fonte-antes.png",
      path: `${owner}/fonte-antes.png`,
      type: "image/png",
      size: 100,
      kind: "Antes",
    };
    const validity = {
      id: randomUUID(),
      date: activity.date,
      store,
      expired: 0,
      atRisk: 2,
      unlinked: 1,
      updatedAt: activity.createdAt,
    };
    const original = {
      ...document([first]),
      activities: [activity],
      incidents: [incident],
      evidence: [evidence],
      validityRecords: [validity],
    };
    await save(original);
    expect(await save({ ...original, titlePresets: [] }, 1)).toBe(2);
    const loaded = (await load())!;
    expect(loaded.data.titlePresets).toEqual([]);
    expect(loaded.data.activities).toEqual([activity]);
    expect(loaded.data.incidents).toEqual([incident]);
    expect(loaded.data.evidence).toEqual([evidence]);
    expect(loaded.data.validityRecords).toEqual([validity]);
    expect(
      (await db.query("select * from public.incident_events")).rows,
    ).toHaveLength(1);
  });

  it("cliente antigo que omite o catálogo mantém os modelos; lista vazia explícita remove", async () => {
    const first = preset();
    await save(document([first]));
    const legacy: Record<string, unknown> = {
      ...document(),
      categories: ["Categoria alterada pelo cliente antigo"],
    };
    delete legacy.titlePresets;
    expect(await save(legacy, 1)).toBe(2);
    const loaded = (await load())!;
    expect(loaded.data.titlePresets).toEqual([first]);
    expect(loaded.data.categories).toEqual(legacy.categories);
    expect(await save(document([]), 2)).toBe(3);
    expect((await load())?.data.titlePresets).toEqual([]);
  });

  it("rejeita catálogos malformados, identidades e nomes duplicados sem alterar snapshot nem revisão", async () => {
    const first = preset();
    await save(document([first]));
    const before = await load();
    const invalid: unknown[] = [
      null,
      {},
      "",
      [null],
      [1],
      [{ name: "Sem identidade" }],
      [{ id: randomUUID() }],
      [{ id: "não-é-uuid", name: "Inválido" }],
      [preset("")],
      [preset("   ")],
      [preset("x".repeat(101))],
      [{ id: randomUUID(), name: 1 }],
      [first, { ...first, name: "Outro título" }],
      [first, preset("máquina adm")],
      [first, preset("Maquina ADM")],
      [first, preset("Maquina   ADM")],
      [first, preset("Ma\u0301quina ADM")],
    ];
    for (const value of invalid) {
      await expect(
        save({ ...document(value), categories: ["Não salvar"] }, 1),
      ).rejects.toThrow();
      expect(await load()).toEqual(before);
    }
    for (const revision of [0, -1, null]) {
      await expect(save(document([]), revision)).rejects.toThrow();
      expect(await load()).toEqual(before);
    }
  });

  it("a constraint protege gravação direta e RLS isola o catálogo por proprietário", async () => {
    const first = preset();
    await save(document([first]));
    const before = await load();
    await expect(
      db.query(
        "update public.workspace_settings set title_presets=$1::jsonb where owner_id=$2::uuid",
        [JSON.stringify([preset("")]), owner],
      ),
    ).rejects.toThrow();
    expect(await load()).toEqual(before);
    await asOwner(otherOwner);
    expect(await load()).toBeNull();
    expect(
      (await db.query("select * from public.workspace_settings")).rows,
    ).toHaveLength(0);
    const unauthorized = await db.query<{ owner_id: string }>(
      "update public.workspace_settings set title_presets='[]'::jsonb where owner_id=$1::uuid returning owner_id",
      [owner],
    );
    expect(unauthorized.rows).toEqual([]);
    await expect(
      db.query(
        "insert into public.workspace_settings(owner_id,title_presets) values($1::uuid,$2::jsonb)",
        [owner, JSON.stringify([preset("Tentativa")])],
      ),
    ).rejects.toThrow();
    const own = preset("Título da outra conta");
    expect(await save(document([own]))).toBe(1);
    expect((await load())?.data.titlePresets).toEqual([own]);
    await asOwner();
    expect(await load()).toEqual(before);
  });

  it("a ausência de validades em cliente legado preserva os registros ao editar títulos", async () => {
    const first = preset();
    const validity = {
      id: randomUUID(),
      date: "2026-11-11",
      store,
      expired: 1,
      atRisk: 0,
      unlinked: 0,
      updatedAt: "2026-11-11T13:00:00.000Z",
    };
    await save({ ...document([first]), validityRecords: [validity] });
    const legacy: Record<string, unknown> = document([preset("Rede")]);
    delete legacy.validityRecords;
    expect(await save(legacy, 1)).toBe(2);
    expect((await load())?.data.validityRecords).toEqual([validity]);
  });
});
