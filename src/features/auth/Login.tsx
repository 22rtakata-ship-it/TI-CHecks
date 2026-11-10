"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Field } from "@/components/ui/shared";

export function Login() {
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [busy, setBusy] = useState(false);
  const recovering = mode === "recover";

  function changeMode() {
    setMode(recovering ? "login" : "recover");
    setMessage("");
    setHasError(false);
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="brand-mark">TI</div>
        <h1>{recovering ? "Recuperar acesso" : "Bem-vindo ao TI Log"}</h1>
        <p>
          {recovering
            ? "Informe seu e-mail para receber um link e definir uma nova senha."
            : "Seu trabalho organizado. Seu histórico preservado."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setMessage("");
            setHasError(false);
            try {
              if (!supabase) {
                throw new Error("Authentication service unavailable");
              }
              if (recovering) {
                const { error } = await supabase.auth.resetPasswordForEmail(
                  email.trim(),
                  { redirectTo: `${window.location.origin}/?setup=1` },
                );
                if (error) throw error;
                setMessage(
                  "Se este e-mail tiver uma conta, você receberá um link para definir sua senha. Confira também a pasta de spam.",
                );
              } else {
                const { error } = await supabase.auth.signInWithPassword({
                  email: email.trim(),
                  password: String(f.get("password") || ""),
                });
                if (error) {
                  setHasError(true);
                  setMessage(
                    "Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.",
                  );
                } else {
                  setMessage("Acesso autorizado.");
                }
              }
            } catch {
              setHasError(true);
              setMessage(
                recovering
                  ? "Não foi possível enviar o link agora. Verifique sua conexão e tente novamente em alguns instantes."
                  : "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="E-mail">
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </Field>
          {!recovering && (
            <Field label="Senha">
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                disabled={busy}
              />
            </Field>
          )}
          {message && (
            <p
              role={hasError ? "alert" : "status"}
              className={hasError ? "error" : undefined}
            >
              {message}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? recovering
                ? "Enviando link…"
                : "Entrando…"
              : recovering
                ? "Enviar link de recuperação"
                : "Entrar"}
          </button>
        </form>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={changeMode}
        >
          {recovering ? "Voltar para entrar" : "Esqueci minha senha"}
        </button>
        <p className="form-hint">
          O primeiro acesso é feito pelo convite enviado ao seu e-mail. O
          cadastro de contas é administrado pela equipe responsável.
        </p>
      </div>
    </main>
  );
}
