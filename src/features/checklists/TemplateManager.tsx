"use client";
import { useState } from "react";
import type { AppData, ChecklistTemplate } from "@/types/domain";
import { Field, Badge, Modal, SectionTitle } from "@/components/ui/shared";
import { id, today } from "@/lib/date";
import { reviseTemplate } from "./service";
const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export function TemplateManager({
  data,
  save,
}: {
  data: AppData;
  save: (d: AppData) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Partial<ChecklistTemplate> | null>(
    null,
  );
  const [recurring, setRecurring] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const open = (t: Partial<ChecklistTemplate>) => {
    setEditing(t);
    setRecurring(t.recurring ?? true);
    setError("");
  };
  return (
    <>
      <SectionTitle eyebrow="ROTINAS" title="Modelos de checklist">
        <button className="primary" onClick={() => open({})}>
          + Novo modelo
        </button>
      </SectionTitle>
      <p className="lead">
        Programe as verificações da semana. Execuções já registradas são
        preservadas.
      </p>
      <div className="panel">
        {data.templates.map((t) => (
          <div className="list-row" key={t.id}>
            <div className="grow">
              <strong>{t.name}</strong>
              <small>
                {t.recurring
                  ? t.weekdays.map((n) => days[n]).join(" · ")
                  : t.date}{" "}
                {t.description && `— ${t.description}`}
              </small>
            </div>
            <Badge>{t.active ? "Ativo" : "Inativo"}</Badge>
            <button onClick={() => open(t)}>Editar</button>
            {!data.executions.some((e) => e.templateId === t.id) && (
              <button
                className="text-button"
                onClick={async () => {
                  if (confirm("Excluir este modelo sem histórico?"))
                    try {
                      await save({
                        ...data,
                        templates: data.templates.filter((x) => x.id !== t.id),
                      });
                    } catch (e) {
                      setError(String(e));
                    }
                }}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <h2 className="spaced">Histórico de execução</h2>
      <div className="panel">
        {data.executions.length ? (
          data.executions
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((e) => (
              <div className="list-row" key={e.id}>
                <div className="grow">
                  <strong>{e.name}</strong>
                  <small>
                    {e.date} · {e.store} · {e.reason || e.notes}
                  </small>
                </div>
                <Badge>{e.status}</Badge>
              </div>
            ))
        ) : (
          <p className="muted-text">Nenhuma execução registrada.</p>
        )}
      </div>
      {editing && (
        <Modal
          title={editing.id ? "Editar modelo" : "Novo checklist"}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              const v = (n: string) => String(f.get(n) || "");
              const weekdays = f.getAll("weekdays").map(Number);
              try {
                if (recurring && !weekdays.length)
                  throw new Error("Selecione pelo menos um dia.");
                if (v("start") && v("end") && v("start") > v("end"))
                  throw new Error("O término deve ser posterior ao início.");
                const t: ChecklistTemplate = {
                  id: editing.id || id(),
                  name: v("name").trim(),
                  description: v("description"),
                  active: f.get("active") === "on",
                  recurring,
                  weekdays,
                  date: recurring ? "" : v("date"),
                  start: v("start"),
                  end: v("end"),
                };
                if (!t.name) throw new Error("Informe o nome.");
                await save({
                  ...data,
                  templates: [
                    ...data.templates.filter((x) => x.id !== t.id),
                    reviseTemplate(
                      data.templates.find((x) => x.id === t.id),
                      t,
                      v("effectiveFrom"),
                    ),
                  ],
                });
                setEditing(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao salvar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Nome *">
              <input name="name" required defaultValue={editing.name} />
            </Field>
            <Field label="Aplicar programação a partir de *">
              <input
                name="effectiveFrom"
                type="date"
                required
                min={editing.history?.at(-1)?.until || today()}
                defaultValue={today()}
              />
            </Field>
            <Field label="Descrição">
              <textarea name="description" defaultValue={editing.description} />
            </Field>
            <label className="check-label">
              <input
                name="active"
                type="checkbox"
                defaultChecked={editing.active ?? true}
              />{" "}
              Ativo
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />{" "}
              Repetir semanalmente
            </label>
            {recurring ? (
              <>
                <div className="weekdays">
                  {days.map((d, i) => (
                    <label key={d}>
                      <input
                        type="checkbox"
                        name="weekdays"
                        value={i}
                        defaultChecked={editing.weekdays?.includes(i)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
                <div className="form-grid">
                  <Field label="Início (opcional)">
                    <input
                      name="start"
                      type="date"
                      defaultValue={editing.start}
                    />
                  </Field>
                  <Field label="Término (opcional)">
                    <input name="end" type="date" defaultValue={editing.end} />
                  </Field>
                </div>
              </>
            ) : (
              <Field label="Data única *">
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={editing.date}
                />
              </Field>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} className="primary">
              Salvar modelo
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
