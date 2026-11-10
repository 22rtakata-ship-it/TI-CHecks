import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { it, expect } from "vitest";
import { initialData } from "@/lib/seed";
it("migração, RPC transacional, unicidade, RLS e isolamento entre usuários", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public,storage to authenticated; grant execute on function auth.uid() to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
 insert into auth.users values ('10000000-0000-4000-8000-000000000001'),('20000000-0000-4000-8000-000000000002');`);
    for (const file of readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    }
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';`,
    );
    const seed = initialData();
    const first = await db.query<{ revision: number }>(
      "select public.save_workspace($1::jsonb,0) as revision",
      [JSON.stringify(seed)],
    );
    expect(Number(first.rows[0].revision)).toBe(1);
    const loaded = await db.query<{ data: { data: unknown } }>(
      "select public.load_workspace() as data",
    );
    expect(loaded.rows[0].data.data).toEqual(seed);
    await expect(
      db.query("select public.save_workspace($1::jsonb,0)", [
        JSON.stringify(seed),
      ]),
    ).rejects.toThrow(/outra sessão/);
    const execution = {
      id: "30000000-0000-4000-8000-000000000003",
      templateId: seed.templates[0].id,
      name: "Diário",
      date: "2027-01-08",
      store: "295 — Itatiba",
      status: "Não concluído",
      reason: "",
      notes: "",
    };
    await expect(
      db.query("select public.save_workspace($1::jsonb,1)", [
        JSON.stringify({ ...seed, executions: [execution] }),
      ]),
    ).rejects.toThrow();
    const good = { ...execution, status: "Concluído" };
    await expect(
      db.query("select public.save_workspace($1::jsonb,1)", [
        JSON.stringify({
          ...seed,
          executions: [
            good,
            { ...good, id: "40000000-0000-4000-8000-000000000004" },
          ],
        }),
      ]),
    ).rejects.toThrow();
    const unchanged = await db.query<{ count: number }>(
      "select count(*)::int as count from public.checklist_templates",
    );
    expect(unchanged.rows[0].count).toBe(5);
    const incidentId = "50000000-0000-4000-8000-000000000005";
    const activityId = "60000000-0000-4000-8000-000000000006";
    const incident = {
      id: incidentId,
      title: "Falha de PDV",
      store: "295 — Itatiba",
      openedOn: "2027-01-08",
      status: "Pendente",
      ticket: "1233542",
      events: [
        {
          id: "70000000-0000-4000-8000-000000000007",
          date: "2027-01-08",
          at: "2027-01-08T13:00:00Z",
          text: "Diagnóstico",
          status: "Pendente",
          activityId,
        },
      ],
    };
    const activity = {
      id: activityId,
      incidentId,
      date: "2027-01-08",
      createdAt: "2027-01-08T13:00:00Z",
      title: "Diagnóstico PDV",
      status: "Pendente",
      store: "295 — Itatiba",
      category: "PDV / Frente de caixa",
      description: "Descrição atualizada sem apagar o diagnóstico original",
      deletedAt: "2027-01-09T13:00:00Z",
      equipment: "PDV 3",
      problem: "Falha original",
      procedure: "Diagnóstico original",
      result: "Aguardando peça",
      revisions: [],
    };
    await db.query("select public.save_workspace($1::jsonb,1)", [
      JSON.stringify({
        ...seed,
        incidents: [incident],
        activities: [activity],
        executions: [good],
      }),
    ]);
    expect(
      (await db.query("select * from public.incident_events")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from public.activities")).rows,
    ).toHaveLength(1);
    // Novos campos opcionais preservam o payload legado e seus vínculos.
    expect(
      (
        await db.query<{ payload: unknown }>(
          "select payload from public.activities where id=$1::uuid",
          [activityId],
        )
      ).rows[0].payload,
    ).toEqual(activity);
    // Snapshots incompletos não podem ser interpretados como exclusões.
    const persisted = (
      await db.query<{ data: unknown }>(
        "select public.load_workspace() as data",
      )
    ).rows[0].data;
    const completeDocument: Record<string, unknown> = {
      ...seed,
      incidents: [incident],
      activities: [activity],
      executions: [good],
    };
    const malformed: unknown[] = [
      null,
      [],
      {},
      { ...completeDocument, version: null },
      { ...completeDocument, version: "1" },
      { ...completeDocument, version: 2 },
    ];
    for (const name of [
      "activities",
      "incidents",
      "templates",
      "executions",
      "evidence",
      "categories",
    ]) {
      const missing = { ...completeDocument };
      delete missing[name];
      malformed.push(
        missing,
        { ...completeDocument, [name]: null },
        { ...completeDocument, [name]: {} },
      );
      if (name !== "categories")
        malformed.push({ ...completeDocument, [name]: [null] });
    }
    malformed.push({ ...completeDocument, categories: [null] });
    for (const document of malformed) {
      await expect(
        db.query("select public.save_workspace($1::jsonb,2)", [
          JSON.stringify(document),
        ]),
      ).rejects.toThrow(/Documento de dados inválido/);
      expect(
        (
          await db.query<{ data: unknown }>(
            "select public.load_workspace() as data",
          )
        ).rows[0].data,
      ).toEqual(persisted);
    }
    for (const expectedRevision of [null, -1]) {
      await expect(
        db.query("select public.save_workspace($1::jsonb,$2::bigint)", [
          JSON.stringify(completeDocument),
          expectedRevision,
        ]),
      ).rejects.toThrow(/Revisão esperada inválida/);
    }
    expect(
      (
        await db.query<{ data: unknown }>(
          "select public.load_workspace() as data",
        )
      ).rows[0].data,
    ).toEqual(persisted);
    await expect(
      db.exec(
        `insert into public.workspace_settings(owner_id) values('20000000-0000-4000-8000-000000000002')`,
      ),
    ).rejects.toThrow();
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('evidence','10000000-0000-4000-8000-000000000001/test.pdf');set request.jwt.claim.sub='20000000-0000-4000-8000-000000000002';`,
    );
    expect(
      (await db.query("select * from public.checklist_templates")).rows,
    ).toHaveLength(0);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      0,
    );
    await expect(
      db.exec(
        `insert into storage.objects(bucket_id,name) values('evidence','10000000-0000-4000-8000-000000000001/evil.pdf')`,
      ),
    ).rejects.toThrow();
    expect(
      (
        await db.query<{ data: unknown }>(
          "select public.load_workspace() as data",
        )
      ).rows[0].data,
    ).toBe(null);
  } finally {
    await db.close();
  }
}, 20000);
