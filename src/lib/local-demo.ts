import type { AppData } from "@/types/domain";
import { normalizeWorkspace } from "./workspace-data";

const key = "ti-log-demo-v1";

export function readLocalDemoData(): AppData | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const data = JSON.parse(raw);
  return normalizeWorkspace(data);
}

export function persistLocalDemoData(data: AppData) {
  localStorage.setItem(key, JSON.stringify(data));
}
