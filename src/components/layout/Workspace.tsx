"use client";

import { supabase } from "@/lib/supabase";
import { Login } from "@/features/auth/Login";
import { SetPassword } from "@/features/auth/SetPassword";
import { ActivityDialog } from "./ActivityDialog";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceNotices } from "./WorkspaceNotices";
import { WorkspacePages } from "./WorkspacePages";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { useWorkspaceController } from "./useWorkspaceController";

export function Workspace() {
  const controller = useWorkspaceController();
  const {
    authReady,
    userId,
    needsPassword,
    fatal,
    ready,
    loadedOwner,
    completePasswordSetup,
  } = controller;
  if (!authReady) return <div className="loading">Verificando acesso…</div>;
  if (supabase && !userId) return <Login />;
  if (supabase && userId && needsPassword)
    return <SetPassword onComplete={completePasswordSetup} />;
  if (fatal)
    return (
      <main className="loading">
        <h2>Os dados não puderam ser carregados</h2>
        <p role="alert">{fatal}</p>
        <button onClick={() => location.reload()}>Tentar novamente</button>
      </main>
    );
  if (!ready || loadedOwner !== (userId || "demo"))
    return <div className="loading">Preparando seu diário…</div>;
  return (
    <div className="app-shell">
      <WorkspaceSidebar controller={controller} />
      <div className="main-area">
        <WorkspaceHeader controller={controller} />
        <main className="content">
          <WorkspaceNotices controller={controller} />
          <WorkspacePages controller={controller} />
          <footer className="page-footer">
            <span>TI Diário · Seu diário técnico de trabalho</span>
            <span>Organização que faz a diferença.</span>
          </footer>
        </main>
      </div>
      <ActivityDialog controller={controller} />
    </div>
  );
}
