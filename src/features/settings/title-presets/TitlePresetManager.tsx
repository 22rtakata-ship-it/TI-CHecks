"use client";

import { useRef, useState } from "react";
import { Field } from "@/components/ui/shared";
import { id } from "@/lib/date";
import type { TitlePreset } from "./types";
import {
  removeTitlePreset,
  saveTitlePreset,
  TITLE_PRESET_NAME_LIMIT,
} from "./service";
import "./title-presets.css";

export function TitlePresetManager({
  presets,
  save,
}: {
  presets: TitlePreset[];
  save: (presets: TitlePreset[]) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string>();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function resetForm() {
    setEditingId(undefined);
    setName("");
  }

  return (
    <section
      className="panel spaced title-presets-panel"
      aria-label="Títulos padrão"
    >
      <h2>Títulos padrão</h2>
      <p className="form-hint">
        Combine um título padrão com o texto da atividade. Exemplo: Máquina ADM
        - Cartazista fonte queimada. Editar ou remover um padrão não altera os
        títulos dos registros anteriores.
      </p>
      {presets.length ? (
        <ul className="title-presets-list">
          {presets.map((preset) => (
            <li key={preset.id} aria-label={`Título padrão ${preset.name}`}>
              <strong>{preset.name}</strong>
              <div className="title-preset-actions">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Editar título padrão ${preset.name}`}
                  onClick={() => {
                    setEditingId(preset.id);
                    setName(preset.name);
                    setNotice("");
                    setError("");
                    input.current?.focus();
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Remover título padrão ${preset.name}`}
                  onClick={async () => {
                    if (
                      !confirm(
                        `Remover o título padrão “${preset.name}” das opções? Os títulos das atividades anteriores serão mantidos.`,
                      )
                    )
                      return;
                    setBusy(true);
                    setError("");
                    setNotice("");
                    try {
                      await save(removeTitlePreset(presets, preset.id));
                      if (editingId === preset.id) resetForm();
                      setNotice("Título padrão removido.");
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível remover o título padrão.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">Nenhum título padrão cadastrado.</p>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setNotice("");
          try {
            await save(
              saveTitlePreset(presets, { id: editingId || id(), name }),
            );
            resetForm();
            setNotice(
              editingId
                ? "Título padrão atualizado."
                : "Título padrão adicionado.",
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Não foi possível salvar o título padrão.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Nome do título padrão">
          <input
            ref={input}
            name="titlePresetName"
            required
            maxLength={TITLE_PRESET_NAME_LIMIT}
            placeholder="Ex.: Máquina ADM"
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="title-preset-actions">
          <button className="primary" disabled={busy} type="submit">
            {busy
              ? "Salvando…"
              : editingId
                ? "Salvar título padrão"
                : "Adicionar título padrão"}
          </button>
          {editingId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                resetForm();
                setError("");
                setNotice("");
              }}
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
