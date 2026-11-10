"use client";

import { useState } from "react";
import { Field } from "@/components/ui/shared";
import { id, statuses, today } from "@/lib/date";
import type { Incident, IncidentEvent } from "./types";
import { statusForResolution } from "./service";

export function IncidentUpdateForm({
  incident,
  busy,
  onSave,
}: {
  incident: Incident;
  busy: boolean;
  onSave: (event: IncidentEvent) => Promise<void>;
}) {
  const [status, setStatus] = useState(incident.status);
  const resolved = status === "Concluído";

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await onSave({
          id: id(),
          date: String(form.get("date")),
          at: new Date().toISOString(),
          text: String(form.get("text")),
          status,
        });
      }}
    >
      <h3>Nova atualização</h3>
      <div className="form-grid">
        <Field label="Data da atualização">
          <input
            name="date"
            type="date"
            required
            min={incident.openedOn}
            defaultValue={today()}
          />
        </Field>
        <Field label="Status">
          <select
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Incident["status"])
            }
          >
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Resolvido?">
          <select
            name="resolved"
            value={resolved ? "Sim" : "Não"}
            onChange={(event) =>
              setStatus(
                statusForResolution(status, event.target.value === "Sim"),
              )
            }
          >
            <option>Não</option>
            <option>Sim</option>
          </select>
        </Field>
      </div>
      <Field label="O que aconteceu? *">
        <textarea
          name="text"
          required
          placeholder="Descreva o retorno, a próxima ação ou a resolução."
        />
      </Field>
      <p className="form-hint">
        Uma atualização de acompanhamento não conta como atividade. Use o botão
        acima para registrar trabalho realizado.
      </p>
      <button className="primary" disabled={busy}>
        Salvar atualização
      </button>
    </form>
  );
}
