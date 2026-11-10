"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/ui/shared";

export function SetPassword({ onComplete }: { onComplete: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <main className="login">
      <div className="login-card">
        <div className="brand-mark">TI</div>
        <h1>{saved ? "Sua senha está pronta" : "Defina sua senha"}</h1>
        {saved ? (
          <>
            <p role="status">
              Senha salva com sucesso. Agora você pode acessar seu diário de
              atividades.
            </p>
            <button className="primary" type="button" onClick={onComplete}>
              Acessar meu diário
            </button>
          </>
        ) : (
          <>
            <p>
              Escolha uma senha com pelo menos 12 caracteres para proteger seu
              acesso ao TI Log.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fields = new FormData(form);
                const password = String(fields.get("password") || "");
                const confirmation = String(fields.get("confirmation") || "");
                setMessage("");
                if (password.length < 12) {
                  setMessage("A senha deve ter pelo menos 12 caracteres.");
                  return;
                }
                if (password !== confirmation) {
                  setMessage(
                    "As senhas não são iguais. Confira a confirmação.",
                  );
                  return;
                }
                setBusy(true);
                try {
                  if (!supabase)
                    throw new Error("Authentication service unavailable");
                  const { error } = await supabase.auth.updateUser({
                    password,
                  });
                  if (error) {
                    setMessage(
                      "Não foi possível atualizar a senha. Use uma senha nova com pelo menos 12 caracteres. Se o link expirou, solicite outro em “Esqueci minha senha”.",
                    );
                    return;
                  }
                  form.reset();
                  setSaved(true);
                } catch {
                  setMessage(
                    "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente. Sua senha não foi confirmada como salva.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Nova senha">
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </Field>
              <Field label="Confirmar nova senha">
                <input
                  type="password"
                  name="confirmation"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </Field>
              {message && (
                <p role="alert" className="error">
                  {message}
                </p>
              )}
              <button className="primary" disabled={busy}>
                {busy ? "Salvando senha…" : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
