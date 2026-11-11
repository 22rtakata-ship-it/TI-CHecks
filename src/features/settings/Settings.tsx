"use client";
import { useState } from "react";
import type { AppData } from "@/types/domain";
import { Field, SectionTitle } from "@/components/ui/shared";
import { TitlePresetManager } from "./title-presets/TitlePresetManager";
export function Settings({
  data,
  save,
}: {
  data: AppData;
  save: (d: AppData) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  return (
    <>
      <SectionTitle eyebrow="PREFERÊNCIAS" title="Configurações" />
      <div className="two-columns">
        <section className="panel">
          <h2>Categorias de atividades</h2>
          <p className="form-hint">
            Remover uma categoria não altera atividades anteriores.
          </p>
          {data.categories.map((c) => (
            <div className="metric" key={c}>
              <span>{c}</span>
              <button
                disabled={data.categories.length <= 1}
                onClick={async () => {
                  if (confirm(`Remover a categoria “${c}” das opções?`))
                    try {
                      await save({
                        ...data,
                        categories: data.categories.filter((x) => x !== c),
                      });
                    } catch {
                      setMessage("Não foi possível salvar.");
                    }
                }}
              >
                Remover
              </button>
            </div>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = String(new FormData(form).get("name") || "").trim();
              if (
                !name ||
                data.categories.some(
                  (c) => c.toLowerCase() === name.toLowerCase(),
                )
              ) {
                setMessage("Informe uma categoria nova.");
                return;
              }
              try {
                await save({ ...data, categories: [...data.categories, name] });
                form.reset();
                setMessage("Categoria adicionada.");
              } catch {
                setMessage("Não foi possível salvar.");
              }
            }}
          >
            <Field label="Nova categoria">
              <input name="name" required maxLength={80} />
            </Field>
            <button className="primary">Adicionar categoria</button>
          </form>
        </section>
        <section className="panel">
          <h2>Dados e ambiente</h2>
          <p>Fuso horário: America/Sao_Paulo</p>
          <p>Lojas: 295 — Itatiba e 178 — Indaiatuba</p>
          <p>
            A demonstração armazena dados somente neste navegador, sem
            autenticação e sem sincronização. Evite usar informações reais da
            empresa.
          </p>
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "ti-diario-backup.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Exportar backup JSON
          </button>
          <h3>Próximas versões</h3>
          <p>
            Administração de usuários, lojas e setores, importação de backup e
            análise de problemas recorrentes ainda não estão disponíveis.
          </p>
        </section>
      </div>
      <TitlePresetManager
        presets={data.titlePresets || []}
        save={(titlePresets) => save({ ...data, titlePresets })}
      />
      {message && <p role="status">{message}</p>}
    </>
  );
}
