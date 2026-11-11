"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyTicketButton({ ticket }: { ticket?: string }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );
  const mounted = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(resetTimer.current);
    };
  }, []);

  if (!ticket?.trim()) return null;

  return (
    <div className="ticket-copy-control">
      <button
        type="button"
        className="ticket-copy"
        aria-label={`Copiar chamado ${ticket}`}
        title={`Copiar chamado ${ticket}`}
        disabled={state === "copying"}
        onClick={async (event) => {
          event.stopPropagation();
          clearTimeout(resetTimer.current);
          setState("copying");
          try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard");
            await navigator.clipboard.writeText(ticket);
            if (!mounted.current) return;
            setState("copied");
            resetTimer.current = setTimeout(() => setState("idle"), 2500);
          } catch {
            if (mounted.current) setState("error");
          }
        }}
      >
        <span className="ticket-copy-number">#{ticket}</span>
        {state === "copied" ? (
          <Check size={13} aria-hidden="true" />
        ) : (
          <Copy size={13} aria-hidden="true" />
        )}
      </button>
      <span
        className={`ticket-copy-feedback ${state === "error" ? "copy-error" : ""}`}
        role={state === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {state === "copied"
          ? "Copiado"
          : state === "error"
            ? "Não foi possível copiar. Tente novamente."
            : ""}
      </span>
    </div>
  );
}
