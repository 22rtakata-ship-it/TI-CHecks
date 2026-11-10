"use client";

import { useEffect, useState, useRef } from "react";
import type { AppData, Activity } from "@/types/domain";
import { initialData } from "@/lib/seed";
import {
  loadData,
  persistData,
  readLocalDemoData,
  canImportLocalDemo,
} from "@/lib/repository";
import { supabase } from "@/lib/supabase";
import { today, stores } from "@/lib/date";
import { prepareActivitySave } from "@/features/activities/workflow";
import { removeActivity, restoreActivity } from "@/features/activities/service";
import { links } from "./navigation";

export function useWorkspaceController() {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [loadedOwner, setLoadedOwner] = useState<string>();
  const [authReady, setAuthReady] = useState(!supabase);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [page, setPage] = useState("diario");
  const [date, setDate] = useState(today);
  const [store, setStore] = useState(stores[0]);
  const [theme, setTheme] = useState("light");
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [demoCandidate, setDemoCandidate] = useState<AppData | null>(null);
  const [fatal, setFatal] = useState("");
  const [form, setForm] = useState<{
    existing?: Activity;
    incidentId?: string;
    checklistId?: string;
  } | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (links.some((l) => l[0] === hash)) setPage(hash);
    setTheme(localStorage.getItem("ti-log-theme") || "light");
    if (!supabase) return;
    setNeedsPassword(new URLSearchParams(location.search).get("setup") === "1");
    supabase.auth.getSession().then(({ data, error }) => {
      if (error)
        setFatal("Não foi possível verificar a sessão. Tente novamente.");
      setUserId(data.session?.user.id);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setNeedsPassword(true);
      setUserId(session?.user.id);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    setForm(null);
    setDemoCandidate(null);
    setNotice("");
  }, [userId]);
  useEffect(() => {
    const sync = () => {
      const value = location.hash.slice(1);
      if (links.some((l) => l[0] === value)) setPage(value);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!authReady || (supabase && !userId)) return;
    let active = true;
    setReady(false);
    loadData(userId)
      .then((d) => {
        if (active) {
          setData(d);
          setLoadedOwner(userId || "demo");
          setReady(true);
          setFatal("");
          if (supabase && userId && canImportLocalDemo(userId)) {
            try {
              setDemoCandidate(readLocalDemoData());
            } catch {
              setNotice(
                "Existe uma cópia local incompatível. Os dados da nuvem foram carregados; a cópia local foi preservada.",
              );
            }
          } else setDemoCandidate(null);
        }
      })
      .catch(() => {
        if (active)
          setFatal(
            "Não foi possível carregar os registros. Verifique a conexão e se a migração foi aplicada. Seus dados não foram substituídos.",
          );
      });
    return () => {
      active = false;
    };
  }, [userId, authReady]);
  async function save(next: AppData) {
    if (saving.current) throw new Error("Aguarde o salvamento em andamento.");
    saving.current = true;
    try {
      await persistData(next, userId);
      setData(next);
      if (supabase) setDemoCandidate(null);
      setNotice(
        supabase
          ? "Dados salvos no Supabase."
          : "Salvo neste navegador — demonstração local.",
      );
    } finally {
      saving.current = false;
    }
  }
  const newActivity = (incidentId?: string, checklistId?: string) =>
    setForm({ incidentId, checklistId });
  async function submitActivity(a: Activity, createIncident: boolean) {
    const next = prepareActivitySave(data, a, createIncident);
    await save(next);
    setForm(null);
  }
  async function removeExistingActivity(activityId: string) {
    await save(removeActivity(data, activityId));
    setForm(null);
  }
  async function restoreExistingActivity(activityId: string) {
    await save(restoreActivity(data, activityId));
  }
  function navigate(value: string) {
    setPage(value);
    location.hash = value;
    setMenu(false);
  }
  function openDay(day: string) {
    setDate(day);
    navigate("diario");
  }
  function completePasswordSetup() {
    const url = new URL(location.href);
    url.searchParams.delete("setup");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    setNeedsPassword(false);
  }
  return {
    data,
    ready,
    loadedOwner,
    authReady,
    needsPassword,
    userId,
    page,
    date,
    store,
    theme,
    menu,
    notice,
    demoCandidate,
    fatal,
    form,
    setDate,
    setStore,
    setTheme,
    setMenu,
    setNotice,
    setForm,
    save,
    newActivity,
    submitActivity,
    removeExistingActivity,
    restoreExistingActivity,
    navigate,
    openDay,
    completePasswordSetup,
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
