"use client";

import { Settings2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { links } from "./navigation";
import type { WorkspaceController } from "./useWorkspaceController";

type WorkspaceSidebarProps = {
  controller: Pick<WorkspaceController, "menu" | "page" | "data" | "navigate">;
};

export function WorkspaceSidebar({ controller }: WorkspaceSidebarProps) {
  const { menu, page, data, navigate } = controller;
  return (
    <aside className={menu ? "sidebar open" : "sidebar"}>
      <a className="brand" href="#diario" onClick={() => navigate("diario")}>
        <span className="brand-mark">TI</span>
        <span>
          TI Log<small>GESTÃO DE ATIVIDADES</small>
        </span>
      </a>
      <div className="nav-label">ÁREA DE TRABALHO</div>
      <nav>
        {links.map(([key, label, Icon]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => navigate(key)}
          >
            <Icon size={18} />
            {label}
            {key === "ocorrencias" &&
              data.incidents.filter(
                (i) => !i.deletedAt && i.status !== "Concluído",
              ).length > 0 && (
                <span className="nav-count">
                  {
                    data.incidents.filter(
                      (i) => !i.deletedAt && i.status !== "Concluído",
                    ).length
                  }
                </span>
              )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-note">
          <ShieldCheck size={18} />
          <div>
            <strong>Seu histórico, organizado.</strong>
            <p>Mais clareza em cada dia de trabalho.</p>
          </div>
        </div>
        <button className="profile" onClick={() => navigate("configuracoes")}>
          <span className="avatar">TI</span>
          <span>
            <strong>Assistente de TI</strong>
            <small>
              {supabase ? "Conta autenticada" : "Ambiente de demonstração"}
            </small>
          </span>
          <Settings2 size={16} />
        </button>
      </div>
    </aside>
  );
}
