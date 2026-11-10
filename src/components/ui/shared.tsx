"use client";
import {
  cloneElement,
  isValidElement,
  useId,
  useEffect,
  useRef,
  type ReactNode,
  type ReactElement,
} from "react";
import { X, Inbox } from "lucide-react";
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  return (
    <span
      className={`badge ${text === "Concluído" ? "green" : text === "A fazer" ? "muted" : text === "Não concluído" || text === "Pendente" ? "amber" : "blue"}`}
    >
      {children}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const modalRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  // Capture before descendants commit autoFocus and replace the active element.
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null),
  );
  const backdropPress = useRef<{
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
    endedOnBackdrop: boolean;
  } | null>(null);
  closeRef.current = onClose;
  useEffect(() => {
    const root = modalRef.current;
    const focusables = () =>
      root?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
      );
    const target =
      root?.querySelector<HTMLElement>("[autofocus]") || focusables()?.[0];
    target?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const items = focusables();
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onPointerDownCapture={(event) => {
        backdropPress.current =
          event.isPrimary &&
          event.button === 0 &&
          event.target === event.currentTarget
            ? {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                moved: false,
                endedOnBackdrop: false,
              }
            : null;
      }}
      onPointerMoveCapture={(event) => {
        const press = backdropPress.current;
        if (
          press?.pointerId === event.pointerId &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8
        )
          press.moved = true;
      }}
      onPointerUpCapture={(event) => {
        const press = backdropPress.current;
        if (press?.pointerId !== event.pointerId) return;
        // Touch may retain pointer capture: check the real release location too.
        press.endedOnBackdrop =
          !press.moved &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) <= 8 &&
          event.target === event.currentTarget &&
          document.elementFromPoint(event.clientX, event.clientY) ===
            event.currentTarget;
      }}
      onPointerCancelCapture={() => {
        backdropPress.current = null;
      }}
      onClick={(event) => {
        const press = backdropPress.current;
        backdropPress.current = null;
        // A text-selection drag can synthesize a click on this common ancestor.
        if (event.target === event.currentTarget && press?.endedOnBackdrop)
          onClose();
      }}
    >
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, {
            id: fieldId,
          })
        : children}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
