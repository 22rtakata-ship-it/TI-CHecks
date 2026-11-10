"use client";

import { supabase } from "@/lib/supabase";
import type { WorkspaceController } from "./useWorkspaceController";

type WorkspaceNoticesProps = {
  controller: Pick<
    WorkspaceController,
    "demoCandidate" | "notice" | "save" | "setNotice"
  >;
};

export function WorkspaceNotices({ controller }: WorkspaceNoticesProps) {
  const { demoCandidate, notice, save, setNotice } = controller;
  return (
    <>
      {!supabase && (
        <div className="demo-banner">
          <span className="demo-dot" />
          <strong>Modo demonstração</strong>
          <span>
            Dados salvos apenas neste navegador. Sem autenticação ou
            sincronização.
          </span>
        </div>
      )}
      {supabase && demoCandidate && (
        <section
          className="notice spaced no-print"
          aria-label="Importar demonstração"
        >
          <strong>
            Há registros deste navegador que ainda não estão na nuvem.
          </strong>
          <p>
            {demoCandidate.activities.length} atividade(s),{" "}
            {demoCandidate.incidents.length} ocorrência(s) e{" "}
            {demoCandidate.executions.length} execução(ões) de checklist e{" "}
            {demoCandidate.validityRecords.length} registro(s) de validades. A
            conta na nuvem ainda não possui um histórico salvo.
          </p>
          <button
            onClick={async () => {
              if (
                !confirm(
                  "Importar os registros deste navegador para sua conta na nuvem? A cópia local será mantida.",
                )
              )
                return;
              try {
                await save(demoCandidate);
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível importar. A cópia local foi preservada.",
                );
              }
            }}
          >
            Importar registros deste navegador
          </button>
        </section>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Dispensar mensagem" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
