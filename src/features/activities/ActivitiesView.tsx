"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Activity, AppData } from "@/types/domain";
import { Empty, Field, SectionTitle } from "@/components/ui/shared";
import { ActivityCards } from "./ActivityCards";
import { searchActivities } from "./service";
import { visibleActivities } from "./visibility";
import { RemovedActivityHistory } from "./RemovedActivityHistory";

export function ActivitiesView({
  data,
  store,
  onNew,
  onEdit,
  onRestore,
}: {
  data: AppData;
  store: string;
  onNew: () => void;
  onEdit: (activity: Activity) => void;
  onRestore?: (activityId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const hintId = useId();
  const storeActivities = searchActivities(visibleActivities(data), store);
  const results = searchActivities(storeActivities, store, query);

  return (
    <>
      <SectionTitle eyebrow="HISTÓRICO" title="Atividades">
        <button className="primary" onClick={onNew}>
          <Plus size={17} /> Nova atividade
        </button>
      </SectionTitle>
      <p className="lead">Encontre os atendimentos registrados em {store}.</p>
      <div className="filter-bar">
        <Field label="Pesquisar atividades">
          <input
            type="search"
            aria-label="Pesquisar atividades"
            aria-describedby={hintId}
            placeholder="Título, categoria ou número do chamado…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        {query && (
          <button onClick={() => setQuery("")}>
            <X size={15} /> Limpar busca
          </button>
        )}
      </div>
      <p className="form-hint" id={hintId}>
        Busque também por #1233542 ou 123-3542. Registros mais recentes aparecem
        primeiro.
      </p>
      <p className="subtle" role="status">
        Exibindo {results.length} de {storeActivities.length}{" "}
        {storeActivities.length === 1 ? "atividade" : "atividades"} nesta loja.
      </p>
      {!storeActivities.length ? (
        <Empty title="Nenhuma atividade registrada nesta loja">
          Use Nova atividade para começar seu histórico de atendimentos.
        </Empty>
      ) : !results.length ? (
        <Empty title="Nenhuma atividade encontrada">
          Nenhum título, categoria ou chamado corresponde à busca. Confira o
          número informado ou limpe a busca para ver todo o histórico da loja.
        </Empty>
      ) : (
        <ActivityCards activities={results} onEdit={onEdit} />
      )}
      {onRestore && (
        <RemovedActivityHistory
          activities={data.activities.filter(
            (activity) => activity.deletedAt && activity.store === store,
          )}
          onRestore={onRestore}
        />
      )}
    </>
  );
}
