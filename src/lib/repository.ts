import type { AppData } from "@/types/domain";
import { initialData } from "./seed";
import { supabase } from "./supabase";
import { readLocalDemoData, persistLocalDemoData } from "./local-demo";
import { normalizeWorkspace } from "./workspace-data";

export { readLocalDemoData } from "./local-demo";

const revisions = new Map<string, number>();
function requireUser(userId?: string): string {
  if (!userId)
    throw new Error(
      "Sua sessão expirou. Entre novamente antes de salvar na nuvem.",
    );
  return userId;
}
export async function loadData(userId?: string): Promise<AppData> {
  if (supabase) {
    const owner = requireUser(userId);
    revisions.delete(owner);
    const { data, error } = await supabase.rpc("load_workspace");
    if (error) throw error;
    const revision = data?.revision ?? 0;
    if (!Number.isSafeInteger(revision) || revision < 0)
      throw new Error(
        "A revisão dos dados na nuvem é inválida. Não foi possível carregar os registros.",
      );
    const snapshot = data?.data ? normalizeWorkspace(data.data) : initialData();
    revisions.set(owner, revision);
    return snapshot;
  }
  return readLocalDemoData() || initialData();
}

export function canImportLocalDemo(userId: string) {
  return !!supabase && revisions.get(userId) === 0;
}

export async function persistData(data: AppData, userId?: string) {
  if (supabase) {
    const owner = requireUser(userId);
    const revision = revisions.get(owner);
    if (revision === undefined)
      throw new Error(
        "Recarregue os registros da sua conta antes de salvar na nuvem.",
      );
    const { data: nextRevision, error } = await supabase.rpc("save_workspace", {
      document: data,
      expected_revision: revision,
    });
    if (error) throw error;
    if (!Number.isSafeInteger(nextRevision) || nextRevision !== revision + 1)
      throw new Error(
        "O servidor não confirmou a revisão do salvamento. Recarregue os registros antes de continuar.",
      );
    revisions.set(owner, nextRevision);
    return;
  }
  persistLocalDemoData(data);
}
