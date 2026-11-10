"use client";
import { useState } from "react";
import { Check, Plus, ClipboardCheck } from "lucide-react";
import type { AppData, ChecklistExecution } from "@/types/domain";
import { planned, saveExecution } from "./service";
import { Badge, Modal, Field } from "@/components/ui/shared";
import { id } from "@/lib/date";
export function ChecklistPanel({
  data,
  date,
  store,
  save,
  onActivity,
}: {
  data: AppData;
  date: string;
  store: string;
  save: (data: AppData) => Promise<void>;
  onActivity: (checklistId: string) => void;
}) {
  const rows = planned(data.templates, data.executions, date, store);
  const [selected, setSelected] = useState<(typeof rows)[number] | null>(null);
  const [status, setStatus] =
    useState<ChecklistExecution["status"]>("Concluído");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="section-heading">
        <h2>
          <ClipboardCheck size={19} /> Checklists do dia{" "}
          <span className="count">{rows.length}</span>
        </h2>
        <span className="subtle">Sua rotina em dia</span>
      </div>
      <div className="checklist-list">
        {rows.length ? (
          rows.map((row) => (
            <div className="checklist-row" key={row.templateId}>
              <div
                className={`check-icon ${row.status === "Concluído" ? "done" : ""}`}
              >
                <Check size={18} />
              </div>
              <div className="grow">
                <strong>{row.name}</strong>
                <small>
                  {row.execution?.notes || "Verificação de rotina programada"}
                </small>
              </div>
              <Badge>{row.status}</Badge>
              <button
                className="text-button"
                onClick={() => {
                  setSelected(row);
                  setStatus(row.execution?.status || "Concluído");
                  setError("");
                }}
              >
                {row.execution ? "Editar" : "Preencher"}
              </button>
              <button
                className="icon-button"
                title="Registrar problema identificado"
                aria-label={`Registrar problema de ${row.name}`}
                onClick={() => onActivity(row.templateId)}
              >
                <Plus size={16} />
              </button>
            </div>
          ))
        ) : (
          <p className="muted-text">
            Nenhum checklist previsto para esta data.
          </p>
        )}
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                await save({
                  ...data,
                  executions: saveExecution(data.executions, {
                    id: selected.execution?.id || id(),
                    templateId: selected.templateId,
                    name: selected.name,
                    date,
                    store,
                    status,
                    reason: String(f.get("reason") || ""),
                    notes: String(f.get("notes") || ""),
                  }),
                });
                setSelected(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao salvar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="A verificação foi executada?">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ChecklistExecution["status"])
                }
              >
                <option value="Concluído">Sim — concluído</option>
                <option value="Não concluído">Não — não concluído</option>
                <option>Não se aplica</option>
              </select>
            </Field>
            {status !== "Concluído" && (
              <Field label="Justificativa obrigatória">
                <textarea
                  required
                  name="reason"
                  defaultValue={selected.execution?.reason}
                />
              </Field>
            )}
            <Field label="Observações (opcional)">
              <textarea name="notes" defaultValue={selected.execution?.notes} />
            </Field>
            <p className="form-hint">
              Um problema técnico pode ser registrado separadamente, mesmo com a
              verificação concluída.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              Salvar checklist
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
