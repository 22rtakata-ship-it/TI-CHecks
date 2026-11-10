import { supabase } from "@/lib/supabase";
const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export function validateFile(file: Pick<File, "size" | "type">) {
  if (!allowed.includes(file.type))
    throw new Error("Use JPG, PNG, WebP ou PDF.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("O limite é 10 MB por arquivo.");
  if (!file.size) throw new Error("O arquivo está vazio.");
}
export async function uploadEvidence(file: File, userId: string) {
  validateFile(file);
  if (!supabase)
    throw new Error("Configure o Supabase para armazenar evidências privadas.");
  const ext: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const path = `${userId}/${crypto.randomUUID()}.${ext[file.type]}`;
  const { error } = await supabase.storage
    .from("evidence")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}
export async function evidenceUrl(path: string) {
  if (!supabase) throw new Error("Armazenamento indisponível.");
  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
export async function removeEvidence(path: string) {
  if (!supabase) throw new Error("Armazenamento indisponível.");
  const { error } = await supabase.storage.from("evidence").remove([path]);
  if (error) throw error;
}
