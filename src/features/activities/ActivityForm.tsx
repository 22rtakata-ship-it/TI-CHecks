"use client";
import { useState } from "react";
import type { Activity, AppData } from "@/types/domain";
import { id, statuses, stores } from "@/lib/date";
import { Field } from "@/components/ui/shared";
import { activityDescription } from "./description";
export function ActivityForm({
  data,
  date,
  store,
  existing,
  incidentId,
  checklistId,
  onSave,
  onRemove,
}: {
  data: AppData;
  date: string;
  store: string;
  existing?: Activity;
  incidentId?: string;
  checklistId?: string;
  onSave: (a: Activity, createIncident: boolean) => Promise<void>;
  onRemove?: (activityId: string) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createIncident, setCreateIncident] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        const val = (k: string) => String(f.get(k) || "");
        try {
          await onSave(
            {
              ...existing,
              id: existing?.id || id(),
              createdAt: existing?.createdAt || new Date().toISOString(),
              date: val("date"),
              store: val("store"),
              title: val("title").trim(),
              category: val("category"),
              sector: val("sector"),
              equipment: existing?.equipment || "",
              problem: existing?.problem || "",
              procedure: existing?.procedure || "",
              result: existing?.result || "",
              notes: existing?.notes || "",
              description: val("description").trim(),
              minutes: val("minutes") ? Number(val("minutes")) : undefined,
              status: val("status") as Activity["status"],
              ticket: val("ticket"),
              nextAction: existing?.nextAction || "",
              dependency: existing?.dependency || "",
              followUp: existing?.followUp || "",
              incidentId: existing?.incidentId || incidentId,
              checklistId: existing?.checklistId || checklistId,
              revisions: existing?.revisions || [],
            },
            createIncident,
          );
        } catch (e) {
          setError(e instanceof Error ? e.message : "Não foi possível salvar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="form-hint">
        Registre o essencial agora. Os detalhes podem ser adicionados depois.
      </p>
      <div className="form-grid">
        <Field label="Data *">
          <input
            name="date"
            type="date"
            required
            defaultValue={existing?.date || date}
          />
        </Field>
        <Field label="Loja *">
          <select name="store" defaultValue={existing?.store || store}>
            {stores.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Título da atividade *">
        <input
          name="title"
          autoFocus
          required
          maxLength={180}
          placeholder="Ex.: Religamento das TVs do açougue"
          defaultValue={existing?.title}
        />
      </Field>
      <div className="form-grid">
        <Field label="Categoria *">
          <select
            name="category"
            defaultValue={existing?.category || data.categories[0]}
          >
            {[
              ...new Set([
                ...data.categories,
                ...(existing ? [existing.category] : []),
              ]),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={existing?.status || "Concluído"}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Setor">
          <input
            name="sector"
            placeholder="Ex.: Açougue"
            defaultValue={existing?.sector}
          />
        </Field>
        <Field label="Tempo gasto (minutos)">
          <input
            name="minutes"
            type="number"
            min="0"
            step="1"
            defaultValue={existing?.minutes}
          />
        </Field>
      </div>
      <Field label="Número do chamado (opcional)">
        <input name="ticket" defaultValue={existing?.ticket} />
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          rows={5}
          placeholder="Descreva a solicitação e o que foi realizado."
          defaultValue={existing ? activityDescription(existing) : ""}
        />
      </Field>
      {!existing?.incidentId && !incidentId ? (
        <>
          <button
            type="button"
            aria-pressed={createIncident}
            onClick={() => setCreateIncident(!createIncident)}
            disabled={busy}
          >
            {createIncident
              ? "✓ Ocorrência será aberta ao salvar"
              : "Abrir ocorrência para acompanhar"}
          </button>
          {createIncident && (
            <p className="form-hint">
              A ocorrência será vinculada a esta atividade e terá acompanhamento
              próprio.
            </p>
          )}
        </>
      ) : (
        <p className="form-hint">
          Esta atividade está vinculada a uma ocorrência.
        </p>
      )}
      {existing && (
        <details>
          <summary>Histórico de edição ({existing.revisions.length})</summary>
          {existing.revisions.map((r, i) => (
            <p key={i}>
              {new Date(r.at).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}{" "}
              · {r.title} · {r.status}
            </p>
          ))}
        </details>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <footer className="form-footer">
        {existing && onRemove ? (
          <button
            type="button"
            className="danger-button"
            disabled={busy}
            onClick={async () => {
              if (
                !confirm(
                  "Remover esta atividade do diário, do histórico e dos relatórios? Ela poderá ser restaurada na aba Atividades. A ocorrência e as evidências serão preservadas.",
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                await onRemove(existing.id);
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível remover a atividade.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Remover atividade
          </button>
        ) : (
          <span>* Campos obrigatórios</span>
        )}
        <button disabled={busy} className="primary" type="submit">
          {busy ? "Salvando…" : "Salvar atividade"}
        </button>
      </footer>
    </form>
  );
}
