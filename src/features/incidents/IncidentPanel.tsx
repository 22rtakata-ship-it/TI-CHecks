"use client";
import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import type { AppData, Incident } from "@/types/domain";
import { Badge, Modal, Empty } from "@/components/ui/shared";
import { updateIncident, removeIncident, restoreIncident } from "./service";
import { IncidentUpdateForm } from "./IncidentUpdateForm";
export function IncidentPanel({
  data,
  incidents,
  save,
  onActivity,
  showRemovalHistory = false,
}: {
  data: AppData;
  incidents: Incident[];
  save: (d: AppData) => Promise<void>;
  onActivity: (id: string) => void;
  showRemovalHistory?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const selected = data.incidents.find((i) => i.id === selectedId);
  const removedCount = incidents.filter((i) => i.deletedAt).length;
  const visible = incidents.filter((i) =>
    showRemovalHistory && showRemoved ? !!i.deletedAt : !i.deletedAt,
  );
  async function changeRemoval(incident: Incident) {
    if (
      !incident.deletedAt &&
      !confirm(
        "Remover esta ocorrência e suas atividades vinculadas do diário, do histórico e dos indicadores? Os registros e anexos ficam guardados para restauração em “Mostrar removidas”.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await save(
        incident.deletedAt
          ? restoreIncident(data, incident.id)
          : removeIncident(data, incident.id),
      );
      setSelectedId(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível alterar a ocorrência.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {showRemovalHistory && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={showRemoved}
            onChange={(e) => {
              setShowRemoved(e.target.checked);
              setError("");
            }}
          />
          Mostrar removidas ({removedCount})
        </label>
      )}
      <div className="incident-list">
        {visible.length ? (
          visible.map((i) => (
            <article
              className={`incident-card ${i.deletedAt ? "incident-removed" : ""}`}
              key={i.id}
            >
              <div className="incident-top">
                <span className="small-label">
                  DESDE {i.openedOn.split("-").reverse().join("/")}
                </span>
                <Badge>{i.deletedAt ? "Removida" : i.status}</Badge>
              </div>
              <h3>{i.title}</h3>
              <p>{i.events.at(-1)?.text}</p>
              <div className="card-bottom">
                <span>
                  {i.ticket ? `Chamado #${i.ticket}` : "Sem chamado"} ·{" "}
                  {i.events.length} atualização(ões)
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedId(i.id);
                    setError("");
                  }}
                >
                  {i.deletedAt ? "Ver histórico →" : "Acompanhar →"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty
            title={
              showRemoved
                ? "Nenhuma ocorrência removida"
                : "Nenhuma ocorrência nesta seleção"
            }
          >
            {showRemoved
              ? "Ocorrências removidas podem ser restauradas aqui."
              : "Os problemas em acompanhamento aparecerão aqui."}
          </Empty>
        )}
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelectedId(null)}>
          <p className="form-hint">
            Aberta em {selected.openedOn} · {selected.store}
          </p>
          {selected.deletedAt && (
            <div className="notice">
              Ocorrência removida em{" "}
              {new Date(selected.deletedAt).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
              . A ocorrência e suas atividades foram retiradas das telas e
              indicadores. Os registros e anexos estão guardados para
              restauração.
            </div>
          )}
          <div className="history">
            {selected.events.map((event) => (
              <div key={event.id}>
                <small>{event.date.split("-").reverse().join("/")}</small>
                <Badge>{event.status}</Badge>
                <p>{event.text}</p>
                {event.activityId && (
                  <small>
                    Atividade vinculada:{" "}
                    {data.activities.find((a) => a.id === event.activityId)
                      ?.title || event.activityId}
                  </small>
                )}
              </div>
            ))}
          </div>
          {!selected.deletedAt && (
            <>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  onActivity(selected.id);
                  setSelectedId(null);
                }}
              >
                Registrar intervenção como atividade
              </button>
              <IncidentUpdateForm
                key={selected.id}
                incident={selected}
                busy={busy}
                onSave={async (event) => {
                  setBusy(true);
                  setError("");
                  try {
                    const changed = updateIncident(selected, event);
                    await save({
                      ...data,
                      incidents: data.incidents.map((i) =>
                        i.id === changed.id ? changed : i,
                      ),
                    });
                    setSelectedId(null);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Erro ao salvar.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="incident-removal">
            <p className="form-hint">
              {selected.deletedAt
                ? "Restaurar devolve a ocorrência e suas atividades ao diário, ao histórico e aos indicadores."
                : "Remove a ocorrência e suas atividades do diário, do histórico e dos indicadores. Os anexos e registros ficam guardados para restauração."}
            </p>
            <button
              className={selected.deletedAt ? "secondary" : "danger-button"}
              disabled={busy}
              onClick={() => changeRemoval(selected)}
            >
              {selected.deletedAt ? (
                <RotateCcw size={16} />
              ) : (
                <Trash2 size={16} />
              )}{" "}
              {selected.deletedAt
                ? "Restaurar ocorrência"
                : "Remover ocorrência"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
