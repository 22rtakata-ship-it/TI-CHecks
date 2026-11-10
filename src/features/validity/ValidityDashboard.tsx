"use client";

import { useState } from "react";
import type { AppData } from "@/types/domain";
import { Field, SectionTitle } from "@/components/ui/shared";
import { today } from "@/lib/date";
import { monthlyValidity } from "./selectors";
import { EvolutionChart } from "./components/EvolutionChart";
import { ValiditySummary } from "./components/ValiditySummary";
import { ValidityMetricCards } from "./components/ValidityMetricCards";
import { ValidityHistory } from "./components/ValidityHistory";
import "./validity.css";

export function ValidityDashboard({
  data,
  store,
  onOpenDay,
}: {
  data: AppData;
  store: string;
  onOpenDay?: (date: string) => void;
}) {
  const currentDate = today();
  const [month, setMonth] = useState(currentDate.slice(0, 7));
  const metrics = monthlyValidity(
    data.validityRecords || [],
    month,
    store,
    currentDate,
  );
  return (
    <div className="validity-page">
      <SectionTitle eyebrow="ACOMPANHAMENTO DA LOJA" title="Validades">
        <Field label="Mês das validades">
          <input
            type="month"
            required
            value={month}
            onChange={(event) =>
              event.target.value && setMonth(event.target.value)
            }
          />
        </Field>
      </SectionTitle>
      <p className="lead">
        {store} · Evolução diária de vencidas, em risco e não vinculados.
        Preenchimento de segunda a sexta-feira.
      </p>
      <ValiditySummary
        metrics={metrics}
        month={month}
        currentDate={currentDate}
      />
      <ValidityMetricCards metrics={metrics} />
      <section
        className="panel validity-chart-panel"
        aria-labelledby="validity-chart-title"
      >
        <h2 id="validity-chart-title">Evolução mensal</h2>
        <p className="form-hint">
          Cada registro representa a situação daquele dia. As quantidades de
          dias diferentes não são somadas como se fossem itens únicos.
        </p>
        <EvolutionChart metrics={metrics} />
        {metrics.recordedDays === 0 && (
          <p className="muted-text">
            Nenhum dia útil preenchido neste mês. Registre as validades no
            diário para iniciar a evolução.
          </p>
        )}
      </section>
      <ValidityHistory
        metrics={metrics}
        month={month}
        store={store}
        currentDate={currentDate}
        onOpenDay={onOpenDay}
      />
    </div>
  );
}
