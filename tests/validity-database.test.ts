import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initialData } from "@/lib/seed";

const owner = "10000000-0000-4000-8000-000000000001";
const otherOwner = "20000000-0000-4000-8000-000000000002";
const store = "295 — Itatiba";
let db: PGlite;

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    date: "2026-11-09",
    store,
    expired: 4,
    atRisk: 12,
    unlinked: 3,
    updatedAt: "2026-11-09T15:00:00.000Z",
    ...overrides,
  };
}
function document(records: unknown[] = []) {
  return { ...initialData(), validityRecords: records };
}
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
  const result = await db.query<{
    workspace: { revision: number; data: ReturnType<typeof document> } | null;
  }>("select public.load_workspace() as workspace");
  return result.rows[0].workspace;
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

describe("Validades no PostgreSQL", () => {
  it("salva, recupera e edita o dia sem duplicar; zero permanece um valor informado", async () => {
    const first = record();
    expect(await save(document([first]))).toBe(1);
    expect((await load())?.data.validityRecords).toEqual([first]);
    const edited = { ...first, expired: 0, atRisk: 0, unlinked: 0 };
    expect(await save(document([edited]), 1)).toBe(2);
    expect((await load())?.data.validityRecords).toEqual([edited]);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int as count from public.validity_records",
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it("impede dois registros no mesmo dia e loja, permitindo lojas e dias distintos", async () => {
    const first = record();
    await save(document([first]));
    const before = await load();
    await expect(save(document([first, record()]), 1)).rejects.toThrow();
    expect(await load()).toEqual(before);
    const otherStore = record({ store: "178 — Indaiatuba" });
    const nextDay = record({ date: "2026-11-10" });
    expect(await save(document([first, otherStore, nextDay]), 1)).toBe(2);
    expect((await load())?.data.validityRecords).toHaveLength(3);
  });

  it("rejeita contagens negativas, fracionárias, fora do limite e campos ausentes sem perder dados", async () => {
    const first = record();
    await save(document([first]));
    const before = await load();
    const invalid: unknown[] = [];
    for (const field of ["expired", "atRisk", "unlinked"]) {
      for (const value of [-1, 1.5, 2147483648, "4", null, false])
        invalid.push(record({ [field]: value }));
      const missing: Record<string, unknown> = record();
      delete missing[field];
      invalid.push(missing);
    }
    for (const field of ["id", "date", "store", "updatedAt"]) {
      const missing: Record<string, unknown> = record();
      delete missing[field];
      invalid.push(missing);
    }
    invalid.push(record({ store: "  " }), record({ updatedAt: "2026-11-09" }));
    for (const item of invalid) {
      await expect(
        save({ ...document([item]), categories: ["Não pode ser salvo"] }, 1),
      ).rejects.toThrow();
      expect(await load()).toEqual(before);
    }
  });

  it("não aceita final de semana nem data civil inválida", async () => {
    const first = record();
    await save(document([first]));
    const before = await load();
    for (const date of [
      "2026-11-14",
      "2026-11-15",
      "2026-02-30",
      "2026-11-09T00:00:00Z",
    ]) {
      await expect(save(document([record({ date })]), 1)).rejects.toThrow();
      expect(await load()).toEqual(before);
    }
  });

  it("mantém validades quando cliente antigo omite a seção e só remove em lista explícita", async () => {
    const first = record();
    await save(document([first]));
    const legacy: Record<string, unknown> = {
      ...initialData(),
      categories: ["Categoria alterada pelo cliente antigo"],
    };
    delete legacy.validityRecords;
    expect(await save(legacy, 1)).toBe(2);
    const loaded = await load();
    expect(loaded?.data.validityRecords).toEqual([first]);
    expect(loaded?.data.categories).toEqual(legacy.categories);
    expect(await save(document([]), 2)).toBe(3);
    expect((await load())?.data.validityRecords).toEqual([]);
  });

  it("rejeita seção nova malformada e revisão inválida sem alterar as seções antigas", async () => {
    await save(document([record()]));
    const before = await load();
    for (const value of [null, {}, "", [null], [1]]) {
      await expect(
        save(
          { ...document(), validityRecords: value, categories: ["Não salvar"] },
          1,
        ),
      ).rejects.toThrow(/Documento de dados inválido/);
      expect(await load()).toEqual(before);
    }
    for (const revision of [0, -1, null]) {
      await expect(save(document([]), revision)).rejects.toThrow();
      expect(await load()).toEqual(before);
    }
  });

  it("isola usuários, bloqueia gravação em nome de outro e preserva os dados do primeiro", async () => {
    const first = record();
    await save(document([first]));
    await asOwner(otherOwner);
    expect(await load()).toBeNull();
    expect(
      (await db.query("select * from public.validity_records")).rows,
    ).toHaveLength(0);
    await expect(
      db.query(
        "insert into public.validity_records(id,owner_id,payload,work_date,updated_at) values($1,$2,$3::jsonb,$4::date,$5::timestamptz)",
        [first.id, owner, JSON.stringify(first), first.date, first.updatedAt],
      ),
    ).rejects.toThrow();
    const other = record();
    await save(document([other]));
    expect((await load())?.data.validityRecords).toEqual([other]);
    await asOwner();
    expect((await load())?.data.validityRecords).toEqual([first]);
  });

  it("constraints de tabela impedem payload com identidade divergente mesmo fora da RPC", async () => {
    const first = record();
    await expect(
      db.query(
        "insert into public.validity_records(id,owner_id,payload,work_date,updated_at) values($1,$2,$3::jsonb,$4::date,$5::timestamptz)",
        [
          randomUUID(),
          owner,
          JSON.stringify(first),
          first.date,
          first.updatedAt,
        ],
      ),
    ).rejects.toThrow();
    expect(
      (await db.query("select * from public.validity_records")).rows,
    ).toHaveLength(0);
  });
});
