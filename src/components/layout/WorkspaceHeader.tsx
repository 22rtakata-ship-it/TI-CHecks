"use client";

import { Building2, LogOut, Menu, Moon, Sun } from "lucide-react";
import { stores } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { links } from "./navigation";
import type { WorkspaceController } from "./useWorkspaceController";

type WorkspaceHeaderProps = {
  controller: Pick<
    WorkspaceController,
    "menu" | "setMenu" | "page" | "store" | "setStore" | "theme" | "setTheme"
  >;
};

export function WorkspaceHeader({ controller }: WorkspaceHeaderProps) {
  const { menu, setMenu, page, store, setStore, theme, setTheme } = controller;
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          aria-label="Abrir menu"
          onClick={() => setMenu(!menu)}
        >
          <Menu size={20} />
        </button>
        <span>Área de trabalho</span>
        <span>/</span>
        <strong>{links.find((l) => l[0] === page)?.[1]}</strong>
      </div>
      <div className="top-actions">
        <Building2 size={17} />
        <select
          aria-label="Selecionar loja"
          value={store}
          onChange={(e) => setStore(e.target.value)}
        >
          {stores.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label="Alternar tema"
          onClick={() => {
            const t = theme === "dark" ? "light" : "dark";
            setTheme(t);
            localStorage.setItem("ti-log-theme", t);
          }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {supabase && (
          <button
            className="icon-button"
            aria-label="Sair"
            onClick={() => supabase!.auth.signOut()}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
