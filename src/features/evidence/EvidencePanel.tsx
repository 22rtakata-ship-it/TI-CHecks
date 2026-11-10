"use client";
import { visibleActivities } from "@/features/activities/visibility";
import { useState } from "react";
import type { AppData, Evidence } from "@/types/domain";
import { Field, SectionTitle, Empty } from "@/components/ui/shared";
import { evidenceUrl, removeEvidence, uploadEvidence } from "./service";
export function EvidencePanel({
  data,
  userId,
  save,
}: {
  data: AppData;
  userId?: string;
  save: (d: AppData) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  return (
    <>
      <SectionTitle eyebrow="DOCUMENTAÇÃO" title="Evidências" />
      <p className="lead">
        Arquivos privados associados ao trabalho registrado. JPG, PNG, WebP ou
        PDF · até 10 MB.
      </p>
      {!userId ? (
        <div className="notice">
          O modo de demonstração não aceita anexos. Configure o Supabase e entre
          na sua conta para usar armazenamento privado.
        </div>
      ) : (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const form = e.currentTarget;
            const f = new FormData(form);
            let path = "";
            try {
              const target = String(f.get("target"));
              path = await uploadEvidence(f.get("file") as File, userId);
              const [kind, targetId] = target.split(":");
              const entry: Evidence = {
                id: crypto.randomUUID(),
                name: (f.get("file") as File).name,
                type: (f.get("file") as File).type,
                size: (f.get("file") as File).size,
                path,
                kind: String(f.get("kind")) as Evidence["kind"],
                ...(kind === "activity"
                  ? { activityId: targetId }
                  : { incidentId: targetId }),
              };
              await save({ ...data, evidence: [...data.evidence, entry] });
              form.reset();
              setMessage("Evidência salva em armazenamento privado.");
            } catch (e) {
              if (path) await removeEvidence(path).catch(() => {});
              setMessage(e instanceof Error ? e.message : "Erro no upload.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <Field label="Vincular a *">
              <select required name="target">
                <option value="">Selecione um registro</option>
                {visibleActivities(data).map((a) => (
                  <option key={a.id} value={`activity:${a.id}`}>
                    Atividade: {a.title}
                  </option>
                ))}
                {data.incidents
                  .filter((i) => !i.deletedAt)
                  .map((i) => (
                    <option key={i.id} value={`incident:${i.id}`}>
                      Ocorrência: {i.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Identificação">
              <select name="kind">
                <option>Documento</option>
                <option>Antes</option>
                <option>Depois</option>
              </select>
            </Field>
          </div>
          <Field label="Arquivo *">
            <input
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
            />
          </Field>
          <p className="form-hint">
            Não anexe credenciais, dados pessoais desnecessários ou informações
            internas sensíveis.
          </p>
          <button disabled={busy} className="primary">
            Enviar evidência
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
      <div className="panel spaced">
        {data.evidence.length ? (
          data.evidence.map((e) => (
            <div className="list-row" key={e.id}>
              <div className="grow">
                <strong>{e.name}</strong>
                <small>
                  {e.kind} · {Math.ceil(e.size / 1024)} KB ·{" "}
                  {data.activities.find((a) => a.id === e.activityId)?.title ||
                    data.incidents.find((i) => i.id === e.incidentId)?.title}
                </small>
              </div>
              <button
                onClick={async () => {
                  try {
                    setPreview({
                      url: await evidenceUrl(e.path),
                      type: e.type,
                      name: e.name,
                    });
                  } catch {
                    setMessage("Não foi possível abrir a evidência.");
                  }
                }}
              >
                Visualizar / baixar
              </button>
              <button
                onClick={async () => {
                  if (confirm("Remover permanentemente esta evidência?")) {
                    try {
                      await removeEvidence(e.path);
                      await save({
                        ...data,
                        evidence: data.evidence.filter((x) => x.id !== e.id),
                      });
                      setMessage("Evidência removida.");
                    } catch {
                      setMessage(
                        "Falha ao remover. Atualize a página para consultar o estado atual.",
                      );
                    }
                  }
                }}
              >
                Remover
              </button>
            </div>
          ))
        ) : (
          <Empty title="Nenhuma evidência anexada" />
        )}
      </div>
      {preview && (
        <div className="panel spaced">
          <button onClick={() => setPreview(null)}>Fechar prévia</button>
          <a href={preview.url} target="_blank" rel="noreferrer">
            Abrir / baixar {preview.name}
          </a>
          {preview.type === "application/pdf" ? (
            <iframe title={preview.name} src={preview.url} />
          ) : (
            <img
              className="evidence-preview"
              src={preview.url}
              alt={preview.name}
            />
          )}
          <small>Link autenticado, válido por 60 segundos.</small>
        </div>
      )}
    </>
  );
}
