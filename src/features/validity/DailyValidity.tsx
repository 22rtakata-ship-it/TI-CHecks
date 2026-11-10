"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import type { AppData } from "@/types/domain";
import { Badge, Field } from "@/components/ui/shared";
import { dayLabel, id } from "@/lib/date";
import { isValidityDay } from "./calendar";
import { saveValidityRecord } from "./records";
import { validityMetrics } from "./metrics";
import "./validity.css";

export function DailyValidity({
  data,
  date,
  store,
  save,
}: {
  data: AppData;
  date: string;
  store: string;
  save: (data: AppData) => Promise<void>;
}) {
  const records = data.validityRecords || [];
  const existing = records.find(
    (record) => record.date === date && record.store === store,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setError("");
    setNotice("");
  }, [date, store]);
  const scheduled = isValidityDay(date);
  return (
    <section
      className="panel validity-daily"
      aria-labelledby="daily-validity-title"
    >
      <div className="section-heading">
        <h2 id="daily-validity-title">
          <CalendarCheck2 size={19} /> Validades do dia
        </h2>
        {scheduled && (
          <Badge>{existing ? "Preenchido" : "Não preenchido"}</Badge>
        )}
      </div>
      <p className="form-hint">
        {dayLabel(date)} · {store} · Rotina de segunda a sexta-feira.
      </p>
      {!scheduled ? (
        <>
          <p className="muted-text">
            Não há preenchimento previsto de validades neste dia.
          </p>
          {existing && (
            <>
              <p className="form-hint">
                Registro anterior preservado, disponível para consulta.
              </p>
              <div className="validity-readonly-values">
                {validityMetrics.map((metric) => (
                  <div key={metric.key}>
                    <span>{metric.label}</span>
                    <strong>
                      {existing[metric.key].toLocaleString("pt-BR")}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <form
          key={`${date}:${store}:${existing?.updatedAt || "new"}`}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError("");
            setNotice("");
            setBusy(true);
            try {
              const values = validityMetrics.map((metric) =>
                String(form.get(metric.key) ?? "").trim(),
              );
              if (values.some((value) => !value))
                throw new Error(
                  "Preencha as três quantidades. Use 0 quando não houver itens.",
                );
              await save({
                ...data,
                validityRecords: saveValidityRecord(records, {
                  id: existing?.id || id(),
                  date,
                  store,
                  expired: Number(values[0]),
                  atRisk: Number(values[1]),
                  unlinked: Number(values[2]),
                  updatedAt: new Date().toISOString(),
                }),
              });
              setNotice("Validades salvas com sucesso.");
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Não foi possível salvar as validades. Tente novamente.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="validity-inputs">
            {validityMetrics.map((metric) => (
              <Field key={metric.key} label={metric.label}>
                <input
                  type="number"
                  name={metric.key}
                  required
                  min={0}
                  max={2_147_483_647}
                  step={1}
                  inputMode="numeric"
                  disabled={busy}
                  defaultValue={existing?.[metric.key] ?? ""}
                  placeholder="Informe a quantidade"
                />
              </Field>
            ))}
          </div>
          <div className="validity-form-footer">
            <span className="form-hint">
              O registro é da loja e data selecionadas. Campos vazios não são
              considerados zero.
            </span>
            <button type="submit" className="primary" disabled={busy}>
              {busy
                ? "Salvando…"
                : existing
                  ? "Atualizar validades"
                  : "Salvar validades"}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="validity-save-notice">
          {notice}
        </p>
      )}
    </section>
  );
}
