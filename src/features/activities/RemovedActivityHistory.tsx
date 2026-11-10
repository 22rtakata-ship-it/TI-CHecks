"use client";

import { useState } from "react";
import type { Activity } from "./types";

export function RemovedActivityHistory({
  activities,
  onRestore,
}: {
  activities: Activity[];
  onRestore: (activityId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  if (!activities.length) return null;
  return (
    <details className="panel spaced">
      <summary>Atividades removidas ({activities.length})</summary>
      <p className="form-hint">
        A remoção preserva o histórico, os vínculos e as evidências. Se a
        ocorrência vinculada também estiver removida, restaure-a para voltar a
        exibir a atividade.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {activities.map((activity) => (
        <div className="list-row" key={activity.id}>
          <div className="grow">
            <strong>{activity.title}</strong>
            <small>{activity.date.split("-").reverse().join("/")}</small>
          </div>
          <button
            type="button"
            disabled={!!busy}
            aria-label={`Restaurar atividade ${activity.title}`}
            onClick={async () => {
              if (!confirm(`Restaurar a atividade “${activity.title}”?`))
                return;
              setBusy(activity.id);
              setError("");
              try {
                await onRestore(activity.id);
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível restaurar a atividade.",
                );
              } finally {
                setBusy("");
              }
            }}
          >
            {busy === activity.id ? "Restaurando…" : "Restaurar"}
          </button>
        </div>
      ))}
    </details>
  );
}
